import { ValidationError } from 'payload';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';

import { extractImageRowMediaIDs, findRawImageRefs, hasUnsupportedBlocks, validateImageRowFences } from '../markdown';

import type { MarkdownCodec } from '../markdown';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Blog, User } from '@payload-types';
import type { Payload } from 'payload';

export type BlogToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec;
};

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

// エラー文言は「LLM が次の一手を自己修正できる指示」として書く(spec のエラー処理方針)。
const toErrorResult = (error: unknown): ToolResult => {
  if (error instanceof ValidationError) {
    const details = (error.data.errors ?? []).map((item) => `- ${item.path ?? '(field)'}: ${item.message}`).join('\n');
    return fail(`Payload の入力検証に失敗しました:\n${details}\n該当フィールドを修正して再実行してください。`);
  }
  console.error('[mcp] tool error', error);
  return fail('内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。');
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// Workers の isolate メモリ保護。media は画像/PDF 想定。
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const UPLOAD_TOO_LARGE_MESSAGE = '画像が大きすぎます(上限 10MB)。縮小・圧縮してから再実行してください。';

const toSummary = (doc: Blog) => ({
  id: doc.id,
  slug: doc.slug,
  title: doc.title,
  publishedAt: doc.publishedAt,
  status: doc._status ?? 'draft',
  excerpt: doc.excerpt,
});

type UploadSource = { data: Buffer; mimetype?: string };

const parseURL = (url: string): URL | undefined => {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

const isPrivateIPv4 = (hostname: string): boolean => {
  const octets = hostname.split('.');
  if (octets.length !== 4) return false;
  const parsed = octets.map((octet) => parseInt(octet, 10));
  const hasInvalidOctet = parsed.some((octet) => Number.isNaN(octet));
  if (hasInvalidOctet) return false;
  const [a, b] = parsed;
  if (a === undefined || b === undefined) return false;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local
  return false;
};

type URLValidator = (url: URL) => string | undefined; // エラーメッセージ or undefined

const PRIVATE_HOST_MESSAGE = '内部ネットワークの URL は使用できません。公開されている画像の URL を指定してください。';

const rejectNonHTTPScheme: URLValidator = (url) => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'http(s) 以外の URL は使用できません。公開されている画像の URL を指定してください。';
  }
  return undefined;
};

// IPv6 literal (URL#hostname keeps brackets, e.g. "[::1]"; bare form also
// contains ":"). IPv4-mapped/link-local/unique-local IPv6 can alias private
// hosts (e.g. [::ffff:127.0.0.1]), so fail closed and reject all IPv6
// literals — public image URLs don't use them.
const rejectIPv6Literal: URLValidator = (url) => {
  if (url.hostname.includes(':')) return PRIVATE_HOST_MESSAGE;
  return undefined;
};

const rejectPrivateHost: URLValidator = (url) => {
  const lower = url.hostname.toLowerCase();
  if (lower === 'localhost') return PRIVATE_HOST_MESSAGE;
  if (lower.endsWith('.local')) return PRIVATE_HOST_MESSAGE;
  if (isPrivateIPv4(lower)) return PRIVATE_HOST_MESSAGE;
  return undefined;
};

const composeValidators =
  (...validators: URLValidator[]): URLValidator =>
  (url) =>
    validators.reduce<string | undefined>((error, validate) => error ?? validate(url), undefined);

// SSRF ガード: caller 供給 URL を fetch する前に、公開画像 URL として妥当かを検証する。
const validateImageURL = (raw: string): string | undefined => {
  const url = parseURL(raw);
  if (url === undefined) return 'URL の形式が不正です。http(s) の画像 URL を指定してください。';
  return composeValidators(rejectNonHTTPScheme, rejectIPv6Literal, rejectPrivateHost)(url);
};

// リダイレクト経由の SSRF を防ぐため、302 等は追従せず失敗として扱う。
const fetchWithoutRedirect = async (url: string): Promise<Response | string> => {
  try {
    return await fetch(url, { redirect: 'error' });
  } catch {
    return '画像 URL の取得に失敗しました(リダイレクトまたはネットワークエラー)。リダイレクトしない最終 URL を直接指定してください。';
  }
};

// content-length ヘッダを信頼できない(未送信/嘘)場合に備え、実際の受信バイト数も
// readCapped 側で上限チェックする。再帰ヘルパーは `let` 禁止ルールに沿うための
// 累積アキュムレータ(chunks, total)を const 引数として引き回す。
const readCapped = async (reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>, chunks: Uint8Array<ArrayBuffer>[], total: number): Promise<Buffer | undefined> => {
  const { done, value } = await reader.read();
  if (done) return Buffer.concat(chunks);
  const nextTotal = total + value.byteLength;
  if (nextTotal > MAX_UPLOAD_BYTES) {
    await reader.cancel();
    return undefined;
  }
  return readCapped(reader, [...chunks, value], nextTotal);
};

const resolveUploadSource = async (input: { url?: string; base64?: string }): Promise<UploadSource | string> => {
  if (input.url !== undefined) {
    const validationError = validateImageURL(input.url);
    if (validationError !== undefined) return validationError;
    const response = await fetchWithoutRedirect(input.url);
    if (typeof response === 'string') return response;
    if (!response.ok) return `画像の取得に失敗しました (HTTP ${response.status})。URL を確認して再実行してください。`;
    const contentLength = response.headers.get('content-length');
    if (contentLength !== null && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
      await response.body?.cancel();
      return UPLOAD_TOO_LARGE_MESSAGE;
    }
    const contentType = response.headers.get('content-type');
    const mimetype = contentType !== null ? contentType.split(';')[0] : undefined;
    if (response.body === null) return { data: Buffer.alloc(0), mimetype };
    const data = await readCapped(response.body.getReader(), [], 0);
    if (data === undefined) return UPLOAD_TOO_LARGE_MESSAGE;
    return { data, mimetype };
  }
  if (input.base64 !== undefined) {
    const data = Buffer.from(input.base64, 'base64');
    if (data.byteLength > MAX_UPLOAD_BYTES) return UPLOAD_TOO_LARGE_MESSAGE;
    return { data };
  }
  return 'url か base64 のどちらかを指定してください。';
};

// 本文 Markdown の生URL画像参照 + image-row フェンス構造 + cell media 実在性を検証し、
// 問題があれば LLM 向け回復指示メッセージ(最初の1件)を返す。問題なければ undefined。
const validateBodyMarkdown = async (bodyMarkdown: string, verifyMediaExists: (id: number) => Promise<boolean>): Promise<string | undefined> => {
  const rawRefs = findRawImageRefs(bodyMarkdown);
  if (rawRefs.length > 0) {
    return `本文に生 URL の画像参照があります: ${rawRefs.join(', ')}\n先に upload_media で画像を登録し、返された ![media:<id>]() を使ってください。`;
  }
  const fenceErrors = validateImageRowFences(bodyMarkdown);
  if (fenceErrors.length > 0) return fenceErrors[0];

  for (const id of [...new Set(extractImageRowMediaIDs(bodyMarkdown))]) {
    const exists = await verifyMediaExists(id);
    if (!exists) return `image-row の media id=${id} が存在しません。upload_media で作成した id を使ってください。`;
  }
  return undefined;
};

type NextBody = { kind: 'skip' } | { kind: 'body'; body: Blog['body'] } | { kind: 'error'; message: string };

// update_post の bodyMarkdown 差し替え可否を判定する。IIFE 禁止ルールのため
// updatePost 本体から切り出した名前付きヘルパ(discriminated union を返す)。
const resolveNextBody = async (bodyMarkdown: string | undefined, current: Blog, codec: MarkdownCodec, verifyMediaExists: (id: number) => Promise<boolean>): Promise<NextBody> => {
  if (bodyMarkdown === undefined) return { kind: 'skip' };
  if (hasUnsupportedBlocks(current.body)) {
    return {
      kind: 'error',
      message:
        'この記事の本文には MCP 非対応の block が含まれるため、bodyMarkdown での上書きはできません(既存 block が破壊されます)。title/excerpt 等の他フィールドのみ更新するか、本文は admin UI で編集してください。',
    };
  }
  const bodyError = await validateBodyMarkdown(bodyMarkdown, verifyMediaExists);
  if (bodyError !== undefined) return { kind: 'error', message: bodyError };
  return { kind: 'body', body: codec.toLexical(bodyMarkdown) };
};

export const createBlogToolHandlers = (deps: BlogToolDeps) => {
  const { payload, user, codec } = deps;

  // depth: 0 で読む — 既定 depth だと body 内の upload node が media doc に populate
  // され、convertLexicalToMarkdown が生 URL(![alt](url))として書き出してしまう。
  // これだと再送/検証で raw ref 扱いされ、往復編集が壊れる(![media:<id>]() が欲しい)。
  const findPost = async (query: { id?: number; slug?: string }): Promise<Blog | null> => {
    if (query.id !== undefined) {
      return payload.findByID({ collection: 'blog', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 });
    }
    if (query.slug !== undefined) {
      const { docs } = await payload.find({
        collection: 'blog',
        draft: true,
        where: { slug: { equals: query.slug } },
        limit: 1,
        overrideAccess: false,
        user,
        depth: 0,
      });
      return docs[0] ?? null;
    }
    return null;
  };

  const verifyMediaExists = async (id: number): Promise<boolean> => {
    const media = await payload.findByID({ collection: 'media', id, disableErrors: true, overrideAccess: false, user });
    return media !== null;
  };

  return {
    listPosts: async (input: { status?: 'draft' | 'published'; limit?: number }): Promise<ToolResult> => {
      try {
        const result = await payload.find({
          collection: 'blog',
          draft: true,
          sort: '-publishedAt',
          limit: input.limit ?? 20,
          overrideAccess: false,
          user,
          ...(input.status !== undefined ? { where: { _status: { equals: input.status } } } : {}),
        });
        return ok(result.docs.map(toSummary));
      } catch (error) {
        return toErrorResult(error);
      }
    },

    getPost: async (input: { id?: number; slug?: string }): Promise<ToolResult> => {
      try {
        if (input.id === undefined && input.slug === undefined) return fail('id か slug のどちらかを指定してください。');
        const doc = await findPost(input);
        if (doc === null) return fail('記事が見つかりません。list_posts で id / slug を確認してください。');
        const bodyEditable = !hasUnsupportedBlocks(doc.body);
        return ok({
          ...toSummary(doc),
          bodyEditable,
          ...(bodyEditable ? { bodyMarkdown: codec.toMarkdown(doc.body) } : { warning: '本文に MCP 非対応の block が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。' }),
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    uploadMedia: async (input: { url?: string; base64?: string; alt: string; filename: string }): Promise<ToolResult> => {
      try {
        const source = await resolveUploadSource(input);
        if (typeof source === 'string') return fail(source);
        const ext = input.filename.split('.').pop()?.toLowerCase() ?? '';
        const mimetype = source.mimetype ?? MIME_BY_EXT[ext];
        if (mimetype === undefined) {
          return fail('MIME type を特定できません。filename に拡張子(jpg/png/webp/gif/avif)を付けて再実行してください。');
        }
        const media = await payload.create({
          collection: 'media',
          data: { alt: input.alt },
          file: { data: source.data, mimetype, name: input.filename, size: source.data.byteLength },
          overrideAccess: false,
          user,
        });
        return ok({
          id: media.id,
          placeholder: `![media:${media.id}]()`,
          url: media.url ?? undefined,
          note: '本文に画像を入れる場合は placeholder をそのまま Markdown に貼る。thumbnail に使う場合は id を thumbnailMediaID に渡す。',
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    createPost: async (input: { title: string; slug: string; excerpt: string; thumbnailMediaID: number; bodyMarkdown: string; publishedAt?: string }): Promise<ToolResult> => {
      try {
        const bodyError = await validateBodyMarkdown(input.bodyMarkdown, verifyMediaExists);
        if (bodyError !== undefined) return fail(bodyError);

        const thumbnailExists = await verifyMediaExists(input.thumbnailMediaID);
        if (!thumbnailExists) {
          return fail(`thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`);
        }
        const created = await payload.create({
          collection: 'blog',
          draft: true,
          data: {
            title: input.title,
            slug: input.slug,
            excerpt: input.excerpt,
            thumbnail: input.thumbnailMediaID,
            publishedAt: input.publishedAt ?? dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD'),
            body: codec.toLexical(input.bodyMarkdown),
            _status: 'draft',
          },
          overrideAccess: false,
          user,
        });
        return ok({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          adminURL: absoluteUrl(`/admin/collections/blog/${created.id}`),
          note: 'draft として作成済み。admin UI の Live Preview で確認後、publish_post で公開する。',
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    updatePost: async (input: { id: number; title?: string; slug?: string; excerpt?: string; thumbnailMediaID?: number; bodyMarkdown?: string; publishedAt?: string }): Promise<ToolResult> => {
      try {
        const current = await findPost({ id: input.id });
        if (current === null) return fail('記事が見つかりません。list_posts で id を確認してください。');
        if (input.thumbnailMediaID !== undefined) {
          const thumbnailExists = await verifyMediaExists(input.thumbnailMediaID);
          if (!thumbnailExists) return fail(`thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。`);
        }
        const nextBody = await resolveNextBody(input.bodyMarkdown, current, codec, verifyMediaExists);
        if (nextBody.kind === 'error') return fail(nextBody.message);
        const updated = await payload.update({
          collection: 'blog',
          id: input.id,
          draft: true,
          data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.slug !== undefined ? { slug: input.slug } : {}),
            ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
            ...(input.thumbnailMediaID !== undefined ? { thumbnail: input.thumbnailMediaID } : {}),
            ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
            ...(nextBody.kind === 'body' ? { body: nextBody.body } : {}),
          },
          overrideAccess: false,
          user,
        });
        return ok({
          id: updated.id,
          slug: updated.slug,
          status: 'draft version saved',
          adminURL: absoluteUrl(`/admin/collections/blog/${updated.id}`),
          note: '変更は draft version として保存済み。公開反映には publish_post が必要。',
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    publishPost: async (input: { id: number }): Promise<ToolResult> => {
      try {
        // draft-promotion: versions.drafts が有効なため update_post の変更は
        // versions テーブルに積まれる。ここで bare `_status` だけを update すると
        // published 済みの main テーブル行の上に浅くマージされ、未公開の draft
        // 編集内容が黙って失われる。最新 draft を読み直し、全フィールドを
        // publishedステータス付きで再送することで最新内容を確実に公開する。
        const current = await payload.findByID({ collection: 'blog', id: input.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 });
        if (current === null) return fail('記事が見つかりません。list_posts で id を確認してください。');
        const thumbnailID = typeof current.thumbnail === 'number' ? current.thumbnail : current.thumbnail.id;
        const updated = await payload.update({
          collection: 'blog',
          id: input.id,
          data: {
            title: current.title,
            slug: current.slug,
            excerpt: current.excerpt,
            thumbnail: thumbnailID,
            publishedAt: current.publishedAt,
            body: current.body,
            _status: 'published',
          },
          overrideAccess: false,
          user,
        });
        return ok({
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          status: updated._status,
          url: absoluteUrl(`/blog/${updated.slug}`),
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },
  };
};

export const registerBlogTools = (server: McpServer, deps: BlogToolDeps): void => {
  const handlers = createBlogToolHandlers(deps);

  server.registerTool(
    'list_posts',
    {
      title: 'blog 記事一覧',
      description: 'blog の記事(draft 含む)を publishedAt 降順で一覧する。',
      inputSchema: {
        status: z.enum(['draft', 'published']).optional().describe('絞り込み。省略時は全件'),
        limit: z.number().int().min(1).max(50).optional().describe('最大件数(default 20)'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listPosts,
  );

  server.registerTool(
    'get_post',
    {
      title: 'blog 記事取得',
      description: '記事 1 件を取得し、本文を Markdown で返す。bodyEditable=false の記事は本文更新不可。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.getPost,
  );

  server.registerTool(
    'upload_media',
    {
      title: '画像アップロード',
      description:
        '画像を media コレクションに登録し、本文用プレースホルダ ![media:<id>]() と thumbnail 用の id を返す。本文への画像埋め込み・thumbnail 指定の前に必ずこれを使う。サイズ上限は 10MB(超過時はエラーになるため事前に縮小・圧縮すること)。',
      inputSchema: {
        url: z.string().url().optional().describe('取得元 URL(url か base64 のどちらか必須。ダウンロードサイズ上限 10MB)'),
        base64: z.string().optional().describe('画像バイナリの base64(デコード後サイズ上限 10MB)'),
        alt: z.string().min(1).describe('代替テキスト(必須)'),
        filename: z.string().min(1).describe('拡張子付きファイル名(例: cover.png)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.uploadMedia,
  );

  server.registerTool(
    'create_post',
    {
      title: 'blog 記事作成(draft)',
      description: '記事を必ず draft として作成する(公開は publish_post のみ)。本文 Markdown の画像は ![media:<id>]() 形式のみ。thumbnail は upload_media で作成した media の id。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        excerpt: z.string().min(1).describe('本文冒頭の貼り付けではなく、記事を一言で説明する独立した要約'),
        thumbnailMediaID: z.number().int(),
        bodyMarkdown: z.string().min(1),
        publishedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('YYYY-MM-DD。省略時は今日(Asia/Tokyo)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createPost,
  );

  server.registerTool(
    'update_post',
    {
      title: 'blog 記事更新(draft 保存)',
      description: '指定フィールドのみ部分更新し draft version として保存する。bodyMarkdown 省略時は本文に触らない。',
      inputSchema: {
        id: z.number().int(),
        title: z.string().min(1).optional(),
        slug: z.string().regex(SLUG_PATTERN).optional(),
        excerpt: z.string().min(1).optional(),
        thumbnailMediaID: z.number().int().optional(),
        bodyMarkdown: z.string().min(1).optional(),
        publishedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updatePost,
  );

  server.registerTool(
    'publish_post',
    {
      title: 'blog 記事公開',
      description: '記事を公開する(サイトに即反映される唯一の操作)。実行前にユーザーの明示的な意思を確認すること。',
      inputSchema: { id: z.number().int() },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    handlers.publishPost,
  );
};
