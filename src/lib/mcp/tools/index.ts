import { err as errResult, errAsync, fromPromise, fromThrowable, ok as okResult, okAsync } from 'neverthrow';
import { ValidationError } from 'payload';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';

import {
  BodyValidationError,
  ImageFetchError,
  ImageURLError,
  InvalidInputError,
  MediaNotFoundError,
  MimeTypeError,
  PayloadOperationError,
  PostNotFoundError,
  UnsupportedBlockError,
  UploadTooLargeError,
} from '../errors';
import { blockSyntaxHelp, extractBlockMediaIDs, findRawImageRefs, hasUnsupportedBlocks, validateBlockFences } from '../markdown';

import type { McpToolError } from '../errors';
import type { MarkdownCodec } from '../markdown';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Result, ResultAsync } from 'neverthrow';
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
// .match の edge で唯一 ToolResult に折り畳む(chaining-neverthrow-results)。discriminate は
// instanceof(modeling-errors-as-classes) — PayloadOperationError だけ cause の中身で
// 分岐が要るので個別分岐、それ以外は自身の message がそのままユーザー向け文言。
const toToolError = (error: McpToolError): ToolResult => {
  if (error instanceof PayloadOperationError) {
    if (error.cause instanceof ValidationError) {
      const details = (error.cause.data.errors ?? []).map((item) => `- ${item.path ?? '(field)'}: ${item.message}`).join('\n');
      return fail(`Payload の入力検証に失敗しました:\n${details}\n該当フィールドを修正して再実行してください。`);
    }
    console.error('[mcp] tool error', error.message, error.cause);
    return fail('内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。');
  }
  return fail(error.message);
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// create_post / update_post の bodyMarkdown 説明。標準 Markdown に加えて、
// 単一画像プレースホルダと、登録済み block(image-row 等)の非標準フェンス構文を
// LLM に教える(block の構文は registry の blockSyntaxHelp から集約)。
const BODY_MARKDOWN_HELP = [
  '本文 Markdown。見出し・リスト・強調・リンク等の標準 Markdown が使える。',
  '画像は必ず upload_media で作成した media を使う。単一画像は ![media:<id>]()(空括弧)。',
  '生 URL 画像(![alt](https://...))は不可 — 先に upload_media で登録して id を得ること。',
  '',
  blockSyntaxHelp(),
].join('\n');

const MIME_BY_EXT = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} satisfies Record<string, string>;

type ImageExtension = keyof typeof MIME_BY_EXT;

const isImageExtension = (ext: string): ext is ImageExtension => Object.hasOwn(MIME_BY_EXT, ext);

const resolveMimetypeFromFilename = (filename: string): string | undefined => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return isImageExtension(ext) ? MIME_BY_EXT[ext] : undefined;
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

type UploadInput = { kind: 'url'; url: string } | { kind: 'base64'; base64: string };

const parseUploadInput = (input: { url?: string; base64?: string }): Result<UploadInput, InvalidInputError> => {
  if (input.url !== undefined) return okResult({ kind: 'url', url: input.url });
  if (input.base64 !== undefined) return okResult({ kind: 'base64', base64: input.base64 });
  return errResult(new InvalidInputError('url か base64 のどちらかを指定してください。'));
};

const resolveUploadMimetype = (source: UploadSource, filename: string): Result<string, MimeTypeError> => {
  const mimetype = source.mimetype ?? resolveMimetypeFromFilename(filename);
  if (mimetype === undefined) {
    return errResult(new MimeTypeError('MIME type を特定できません。filename に拡張子(jpg/png/webp/gif/avif)を付けて再実行してください。'));
  }
  return okResult(mimetype);
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

type URLValidator = (url: URL) => Result<URL, ImageURLError>;

const PRIVATE_HOST_MESSAGE = '内部ネットワークの URL は使用できません。公開されている画像の URL を指定してください。';

const rejectNonHTTPScheme: URLValidator = (url) => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return errResult(new ImageURLError('http(s) 以外の URL は使用できません。公開されている画像の URL を指定してください。'));
  }
  return okResult(url);
};

// IPv6 literal (URL#hostname keeps brackets, e.g. "[::1]"; bare form also
// contains ":"). IPv4-mapped/link-local/unique-local IPv6 can alias private
// hosts (e.g. [::ffff:127.0.0.1]), so fail closed and reject all IPv6
// literals — public image URLs don't use them.
const rejectIPv6Literal: URLValidator = (url) => {
  if (url.hostname.includes(':')) return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  return okResult(url);
};

const rejectPrivateHost: URLValidator = (url) => {
  const lower = url.hostname.toLowerCase();
  if (lower === 'localhost') return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  if (lower.endsWith('.local')) return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  if (isPrivateIPv4(lower)) return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  return okResult(url);
};

const parseURL = fromThrowable(
  (value: string) => new URL(value),
  () => new ImageURLError('URL の形式が不正です。http(s) の画像 URL を指定してください。'),
);

// SSRF ガード: caller 供給 URL を fetch する前に、公開画像 URL として妥当かを検証する。
// 検証順は scheme → IPv6 literal → private host(小関数 + andThen 合成)。
const validateImageURL = (raw: string): Result<URL, ImageURLError> => parseURL(raw).andThen(rejectNonHTTPScheme).andThen(rejectIPv6Literal).andThen(rejectPrivateHost);

// リダイレクト経由の SSRF を防ぐため、302 等は追従せず失敗として扱う。
const fetchWithoutRedirect = (url: string): ResultAsync<Response, ImageFetchError> =>
  fromPromise(fetch(url, { redirect: 'error' }), () => new ImageFetchError('画像 URL の取得に失敗しました(リダイレクトまたはネットワークエラー)。リダイレクトしない最終 URL を直接指定してください。'));

const cancelBody = (body: Response['body']): ResultAsync<void, PayloadOperationError> => {
  if (body === null) return okAsync(undefined);
  return fromPromise(body.cancel(), (cause) => new PayloadOperationError('画像ストリームのキャンセルに失敗しました', { cause }));
};

// content-length ヘッダを信頼できない(未送信/嘘)場合に備え、実際の受信バイト数も
// readCapped 側で上限チェックする。再帰ヘルパーは `let` 禁止ルールに沿うための
// 累積アキュムレータ(chunks, total)を const 引数として引き回す。
const readCapped = (reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>, chunks: Uint8Array<ArrayBuffer>[], total: number): ResultAsync<Buffer, McpToolError> =>
  fromPromise(reader.read(), (cause) => new PayloadOperationError('画像ストリームの読み取りに失敗しました', { cause })).andThen(({ done, value }) => {
    if (done) return okAsync(Buffer.concat(chunks));
    const nextTotal = total + value.byteLength;
    if (nextTotal <= MAX_UPLOAD_BYTES) return readCapped(reader, [...chunks, value], nextTotal);
    return fromPromise(reader.cancel(), (cause) => new PayloadOperationError('画像ストリームのキャンセルに失敗しました', { cause })).andThen(() =>
      errAsync(new UploadTooLargeError(UPLOAD_TOO_LARGE_MESSAGE)),
    );
  });

const handleFetchedImage = (response: Response): ResultAsync<UploadSource, McpToolError> => {
  if (!response.ok) {
    return errAsync(new ImageFetchError(`画像の取得に失敗しました (HTTP ${response.status})。URL を確認して再実行してください。`));
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
    return cancelBody(response.body).andThen(() => errAsync(new UploadTooLargeError(UPLOAD_TOO_LARGE_MESSAGE)));
  }
  const contentType = response.headers.get('content-type');
  const mimetype = contentType !== null ? contentType.split(';')[0] : undefined;
  if (response.body === null) return okAsync({ data: Buffer.alloc(0), mimetype });
  return readCapped(response.body.getReader(), [], 0).map((data) => ({ data, mimetype }));
};

const resolveUploadFromURL = (url: string): ResultAsync<UploadSource, McpToolError> =>
  validateImageURL(url)
    .map(() => url)
    .asyncAndThen(fetchWithoutRedirect)
    .andThen(handleFetchedImage);

const resolveUploadFromBase64 = (base64: string): ResultAsync<UploadSource, UploadTooLargeError> => {
  const data = Buffer.from(base64, 'base64');
  if (data.byteLength > MAX_UPLOAD_BYTES) return errAsync(new UploadTooLargeError(UPLOAD_TOO_LARGE_MESSAGE));
  return okAsync({ data });
};

const resolveUploadSource = (input: { url?: string; base64?: string }): ResultAsync<UploadSource, McpToolError> =>
  parseUploadInput(input).asyncAndThen((source): ResultAsync<UploadSource, McpToolError> => {
    switch (source.kind) {
      case 'url':
        return resolveUploadFromURL(source.url);
      case 'base64':
        return resolveUploadFromBase64(source.base64);
      default: {
        const _exhaustive: never = source;
        throw new Error(`unhandled upload source: ${JSON.stringify(_exhaustive)}`);
      }
    }
  });

type PostQuery = { kind: 'id'; id: number } | { kind: 'slug'; slug: string };

const parsePostQuery = (input: { id?: number; slug?: string }): Result<PostQuery, InvalidInputError> => {
  if (input.id !== undefined) return okResult({ kind: 'id', id: input.id });
  if (input.slug !== undefined) return okResult({ kind: 'slug', slug: input.slug });
  return errResult(new InvalidInputError('id か slug のどちらかを指定してください。'));
};

type VerifyMediaExists = (id: number) => ResultAsync<boolean, PayloadOperationError>;
type ToLexicalSafe = (markdown: string) => Result<Blog['body'], PayloadOperationError>;
type ToMarkdownSafe = (data: Blog['body']) => Result<string, PayloadOperationError>;

const verifyMediaExistsOrFail = (verifyMediaExists: VerifyMediaExists, id: number, notFoundMessage: string): ResultAsync<void, MediaNotFoundError | PayloadOperationError> =>
  verifyMediaExists(id).andThen((exists) => (exists ? okAsync(undefined) : errAsync(new MediaNotFoundError(notFoundMessage))));

const verifyAllMediaExist = (verifyMediaExists: VerifyMediaExists, ids: number[]): ResultAsync<void, McpToolError> => {
  const [firstID, ...restIDs] = ids;
  if (firstID === undefined) return okAsync(undefined);
  return verifyMediaExistsOrFail(verifyMediaExists, firstID, `image-row の media id=${firstID} が存在しません。upload_media で作成した id を使ってください。`).andThen(() =>
    verifyAllMediaExist(verifyMediaExists, restIDs),
  );
};

// 本文 Markdown の生URL画像参照 + image-row フェンス構造 + cell media 実在性を検証し、
// 問題があれば LLM 向け回復指示メッセージ(最初の1件)を持つ Result を返す。
const validateBodyMarkdown = (bodyMarkdown: string, verifyMediaExists: VerifyMediaExists): ResultAsync<void, McpToolError> => {
  const rawRefs = findRawImageRefs(bodyMarkdown);
  if (rawRefs.length > 0) {
    return errAsync(new BodyValidationError(`本文に生 URL の画像参照があります: ${rawRefs.join(', ')}\n先に upload_media で画像を登録し、返された ![media:<id>]() を使ってください。`));
  }
  const [firstFenceError] = validateBlockFences(bodyMarkdown);
  if (firstFenceError !== undefined) return errAsync(new BodyValidationError(firstFenceError));

  const mediaIDs = [...new Set(extractBlockMediaIDs(bodyMarkdown))];
  return verifyAllMediaExist(verifyMediaExists, mediaIDs);
};

type NextBody = { kind: 'skip' } | { kind: 'body'; body: Blog['body'] };

// update_post の bodyMarkdown 差し替え可否を判定する。
const resolveNextBody = (bodyMarkdown: string | undefined, current: Blog, toLexicalSafe: ToLexicalSafe, verifyMediaExists: VerifyMediaExists): ResultAsync<NextBody, McpToolError> => {
  if (bodyMarkdown === undefined) return okAsync({ kind: 'skip' });
  if (hasUnsupportedBlocks(current.body)) {
    return errAsync(
      new UnsupportedBlockError(
        'この記事の本文には MCP 非対応の block が含まれるため、bodyMarkdown での上書きはできません(既存 block が破壊されます)。title/excerpt 等の他フィールドのみ更新するか、本文は admin UI で編集してください。',
      ),
    );
  }
  return validateBodyMarkdown(bodyMarkdown, verifyMediaExists)
    .andThen(() => toLexicalSafe(bodyMarkdown))
    .map((body): NextBody => ({ kind: 'body', body }));
};

// IIFE 禁止ルールのため updatePost 本体から切り出した名前付きヘルパ。
// NextBody を update data へのパッチ(spread 用の部分オブジェクト)に変換する。
const buildBodyPatch = (nextBody: NextBody): Partial<Pick<Blog, 'body'>> => {
  switch (nextBody.kind) {
    case 'skip':
      return {};
    case 'body':
      return { body: nextBody.body };
    default: {
      const _exhaustive: never = nextBody;
      throw new Error(`unhandled next body: ${JSON.stringify(_exhaustive)}`);
    }
  }
};

const verifyThumbnailIfProvided = (verifyMediaExists: VerifyMediaExists, thumbnailMediaID: number | undefined): ResultAsync<void, McpToolError> => {
  if (thumbnailMediaID === undefined) return okAsync(undefined);
  return verifyMediaExistsOrFail(verifyMediaExists, thumbnailMediaID, `thumbnailMediaID=${thumbnailMediaID} の media が存在しません。`);
};

export const createBlogToolHandlers = (deps: BlogToolDeps) => {
  const { payload, user, codec } = deps;

  const toLexicalSafe: ToLexicalSafe = fromThrowable(
    (markdown: string) => codec.toLexical(markdown),
    (cause) => new PayloadOperationError('Markdown → Lexical 変換に失敗しました', { cause }),
  );

  const toMarkdownSafe: ToMarkdownSafe = fromThrowable(
    (data: Blog['body']) => codec.toMarkdown(data),
    (cause) => new PayloadOperationError('Lexical → Markdown 変換に失敗しました', { cause }),
  );

  // depth: 0 で読む — 既定 depth だと body 内の upload node が media doc に populate
  // され、convertLexicalToMarkdown が生 URL(![alt](url))として書き出してしまう。
  // これだと再送/検証で raw ref 扱いされ、往復編集が壊れる(![media:<id>]() が欲しい)。
  const findPost = (query: PostQuery): ResultAsync<Blog | null, PayloadOperationError> => {
    switch (query.kind) {
      case 'id':
        return fromPromise(
          payload.findByID({ collection: 'blog', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('記事取得に失敗しました', { cause }),
        );
      case 'slug':
        return fromPromise(
          payload.find({ collection: 'blog', draft: true, where: { slug: { equals: query.slug } }, limit: 1, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('記事取得に失敗しました', { cause }),
        ).map(({ docs }) => docs[0] ?? null);
      default: {
        const _exhaustive: never = query;
        throw new Error(`unhandled post query: ${JSON.stringify(_exhaustive)}`);
      }
    }
  };

  const verifyMediaExists: VerifyMediaExists = (id) =>
    fromPromise(payload.findByID({ collection: 'media', id, disableErrors: true, overrideAccess: false, user }), (cause) => new PayloadOperationError('media 取得に失敗しました', { cause })).map(
      (media) => media !== null,
    );

  const buildGetPostPayload = (doc: Blog) => {
    const bodyEditable = !hasUnsupportedBlocks(doc.body);
    if (!bodyEditable) {
      return okResult({
        ...toSummary(doc),
        bodyEditable,
        warning: '本文に MCP 非対応の block が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。',
      });
    }
    return toMarkdownSafe(doc.body).map((bodyMarkdown) => ({ ...toSummary(doc), bodyEditable, bodyMarkdown }));
  };

  return {
    listPosts: (input: { status?: 'draft' | 'published'; limit?: number }): Promise<ToolResult> =>
      fromPromise(
        payload.find({
          collection: 'blog',
          draft: true,
          sort: '-publishedAt',
          limit: input.limit ?? 20,
          overrideAccess: false,
          user,
          ...(input.status !== undefined ? { where: { _status: { equals: input.status } } } : {}),
        }),
        (cause) => new PayloadOperationError('記事一覧取得に失敗しました', { cause }),
      )
        .map((result) => result.docs.map(toSummary))
        .match(ok, toToolError),

    getPost: (input: { id?: number; slug?: string }): Promise<ToolResult> =>
      parsePostQuery(input)
        .asyncAndThen(findPost)
        .andThen((doc) => (doc === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id / slug を確認してください。')) : okAsync(doc)))
        .andThen(buildGetPostPayload)
        .match(ok, toToolError),

    uploadMedia: (input: { url?: string; base64?: string; alt: string; filename: string }): Promise<ToolResult> =>
      resolveUploadSource(input)
        .andThen((source) => resolveUploadMimetype(source, input.filename).map((mimetype) => ({ source, mimetype })))
        .andThen(({ source, mimetype }) =>
          fromPromise(
            payload.create({
              collection: 'media',
              data: { alt: input.alt },
              file: { data: source.data, mimetype, name: input.filename, size: source.data.byteLength },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('media 作成に失敗しました', { cause }),
          ),
        )
        .map((media) => ({
          id: media.id,
          placeholder: `![media:${media.id}]()`,
          url: media.url ?? undefined,
          note: '本文に画像を入れる場合は placeholder をそのまま Markdown に貼る。thumbnail に使う場合は id を thumbnailMediaID に渡す。',
        }))
        .match(ok, toToolError),

    createPost: (input: { title: string; slug: string; excerpt: string; thumbnailMediaID: number; bodyMarkdown: string; publishedAt?: string }): Promise<ToolResult> =>
      validateBodyMarkdown(input.bodyMarkdown, verifyMediaExists)
        .andThen(() =>
          verifyMediaExistsOrFail(verifyMediaExists, input.thumbnailMediaID, `thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`),
        )
        .andThen(() => toLexicalSafe(input.bodyMarkdown))
        .andThen((body) =>
          fromPromise(
            payload.create({
              collection: 'blog',
              draft: true,
              data: {
                title: input.title,
                slug: input.slug,
                excerpt: input.excerpt,
                thumbnail: input.thumbnailMediaID,
                publishedAt: input.publishedAt ?? dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD'),
                body,
                _status: 'draft',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('記事作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          adminURL: absoluteUrl(`/admin/collections/blog/${created.id}`),
          note: 'draft として作成済み。admin UI の Live Preview で確認後、publish_post で公開する。',
        }))
        .match(ok, toToolError),

    updatePost: (input: { id: number; title?: string; slug?: string; excerpt?: string; thumbnailMediaID?: number; bodyMarkdown?: string; publishedAt?: string }): Promise<ToolResult> =>
      findPost({ kind: 'id', id: input.id })
        .andThen((current) => (current === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id を確認してください。')) : okAsync(current)))
        .andThen((current) => verifyThumbnailIfProvided(verifyMediaExists, input.thumbnailMediaID).map(() => current))
        .andThen((current) => resolveNextBody(input.bodyMarkdown, current, toLexicalSafe, verifyMediaExists))
        .andThen((nextBody) =>
          fromPromise(
            payload.update({
              collection: 'blog',
              id: input.id,
              draft: true,
              data: {
                ...(input.title !== undefined ? { title: input.title } : {}),
                ...(input.slug !== undefined ? { slug: input.slug } : {}),
                ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
                ...(input.thumbnailMediaID !== undefined ? { thumbnail: input.thumbnailMediaID } : {}),
                ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
                ...buildBodyPatch(nextBody),
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('記事更新に失敗しました', { cause }),
          ),
        )
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          status: 'draft version saved',
          adminURL: absoluteUrl(`/admin/collections/blog/${updated.id}`),
          note: '変更は draft version として保存済み。公開反映には publish_post が必要。',
        }))
        .match(ok, toToolError),

    publishPost: (input: { id: number }): Promise<ToolResult> =>
      fromPromise(
        payload.findByID({ collection: 'blog', id: input.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
        (cause) => new PayloadOperationError('記事取得に失敗しました', { cause }),
      )
        .andThen((current) => (current === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id を確認してください。')) : okAsync(current)))
        .andThen((current) => {
          // draft-promotion: versions.drafts が有効なため update_post の変更は
          // versions テーブルに積まれる。ここで bare `_status` だけを update すると
          // published 済みの main テーブル行の上に浅くマージされ、未公開の draft
          // 編集内容が黙って失われる。最新 draft を読み直し、全フィールドを
          // publishedステータス付きで再送することで最新内容を確実に公開する。
          const thumbnailID = typeof current.thumbnail === 'number' ? current.thumbnail : current.thumbnail.id;
          return fromPromise(
            payload.update({
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
            }),
            (cause) => new PayloadOperationError('記事公開に失敗しました', { cause }),
          );
        })
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          status: updated._status,
          url: absoluteUrl(`/blog/${updated.slug}`),
        }))
        .match(ok, toToolError),
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
      description: '記事を必ず draft として作成する(公開は publish_post のみ)。本文の画像・block 構文は bodyMarkdown フィールドの説明を参照。thumbnail は upload_media で作成した media の id。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        excerpt: z.string().min(1).describe('本文冒頭の貼り付けではなく、記事を一言で説明する独立した要約'),
        thumbnailMediaID: z.number().int(),
        bodyMarkdown: z.string().min(1).describe(BODY_MARKDOWN_HELP),
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
        bodyMarkdown: z.string().min(1).optional().describe(BODY_MARKDOWN_HELP),
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
