import { err as errResult, errAsync, fromPromise, fromThrowable, ok as okResult, okAsync } from 'neverthrow';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';

import { ImageFetchError, ImageURLError, InvalidInputError, MimeTypeError, PayloadOperationError, PostNotFoundError, UploadTooLargeError } from '../errors';
import { isRoundTrippableAlt } from '../markdown/image-ref';
import { MAX_UPLOAD_BYTES, UPLOAD_URL_TTL_SECONDS, resolveMimetypeFromFilename, signUploadURLParams } from '../upload-url';

import { BODY_MARKDOWN_HELP, buildBodyPatch, createBodyPipeline, verifyMediaExistsOrFail, verifyThumbnailIfProvided } from './shared/body-pipeline';
import { requireSlugAvailable } from './shared/require-slug-available';
import { ok, toToolError } from './shared/tool-result';

import type { McpToolError } from '../errors';
import type { MarkdownCodec } from '../markdown';
import type { ToolResult } from './shared/tool-result';
import type { McpServer } from '@modelcontextprotocol/server';
import type { Result, ResultAsync } from 'neverthrow';
import type { Blog, User } from '@payload-types';
import type { Payload } from 'payload';

export type BlogToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec<Blog['body']>;
  signingSecret: string;
  siteBaseUrl: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const UPLOAD_TOO_LARGE_MESSAGE = '画像が大きすぎます(上限 10MB)。縮小・圧縮してから再実行してください。';

// alt は本文中で ![media:<id>](alt) 表記のまま保存・往復する。alt regex が [^)]* の
// ため半角 ')' を含む alt は括弧を途中で閉じてしまい往復できない(get_post → write の
// 再送で alt が途中で切り詰められ、末尾が本文へ漏れ出す)。schema(zod .refine)側の
// 表明と同じ制約をここでも handler レベルで検証し、直接呼び出しでも防ぐ。
const ALT_CLOSE_PAREN_MESSAGE = 'alt に半角の ")" は使えません。全角の「）」を使ってください。';

const validateUploadAlt = (alt: string): Result<string, InvalidInputError> => (isRoundTrippableAlt(alt) ? okResult(alt) : errResult(new InvalidInputError(ALT_CLOSE_PAREN_MESSAGE)));

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

const MIME_TYPE_ERROR_MESSAGE = 'MIME type を特定できません。filename に拡張子(jpg/png/webp/gif/avif)を付けて再実行してください。';

const resolveUploadMimetype = (source: UploadSource, filename: string): Result<string, MimeTypeError> => {
  const mimetype = source.mimetype ?? resolveMimetypeFromFilename(filename);
  if (mimetype === undefined) {
    return errResult(new MimeTypeError(MIME_TYPE_ERROR_MESSAGE));
  }
  return okResult(mimetype);
};

// create_upload_url は実バイトを持たないため resolveUploadMimetype(source ベース)は使えず、
// 拡張子だけを見て事前に拒否する(実際の MIME 判定は POST /api/media-upload 側で行う)。
const validateUploadFilenameExtension = (filename: string): Result<void, MimeTypeError> =>
  resolveMimetypeFromFilename(filename) === undefined ? errResult(new MimeTypeError(MIME_TYPE_ERROR_MESSAGE)) : okResult(undefined);

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

export const createBlogToolHandlers = (deps: BlogToolDeps) => {
  const { payload, user, codec, signingSecret, siteBaseUrl } = deps;

  // 本文パイプライン(検証 / alt 同期 / Lexical 往復 / newTab)は works と共用の shared モジュール。
  // blog は body 必須なので buildBodyPayload / resolveNextBody には doc.body をそのまま渡す。
  const { prepareBody, resolveNextBody, buildBodyPayload, verifyMediaExists } = createBodyPipeline({ payload, user, codec, siteBaseUrl });

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

  const buildGetPostPayload = (doc: Blog) => buildBodyPayload(doc.body).map((bodyPayload) => ({ ...toSummary(doc), ...bodyPayload }));

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

    listMedia: (input: { search?: string; limit?: number }): Promise<ToolResult> =>
      fromPromise(
        payload.find({
          collection: 'media',
          sort: '-createdAt',
          limit: input.limit ?? 20,
          overrideAccess: false,
          user,
          depth: 0,
          ...(input.search !== undefined ? { where: { or: [{ filename: { contains: input.search } }, { alt: { contains: input.search } }] } } : {}),
        }),
        (cause) => new PayloadOperationError('media 一覧取得に失敗しました', { cause }),
      )
        .map((result) =>
          result.docs.map((media) => ({
            id: media.id,
            filename: media.filename ?? undefined,
            alt: media.alt,
            url: media.url ?? undefined,
            width: media.width ?? undefined,
            height: media.height ?? undefined,
            mimeType: media.mimeType ?? undefined,
            // alt が ')' を含む doc は placeholder に埋め込まない(get_post の
            // filterRoundTrippableAlts と同じ往復制約) — 空 alt で返し、
            // write 側の空 alt エラーで LLM に alt の書き換えを促す。alt フィールド自体は
            // 生の doc alt のまま返す(情報として有用なため)。
            placeholder: isRoundTrippableAlt(media.alt) ? `![media:${media.id}](${media.alt})` : `![media:${media.id}]()`,
          })),
        )
        .match(ok, toToolError),

    getPost: (input: { id?: number; slug?: string }): Promise<ToolResult> =>
      parsePostQuery(input)
        .asyncAndThen(findPost)
        .andThen((doc) => (doc === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id / slug を確認してください。')) : okAsync(doc)))
        .andThen(buildGetPostPayload)
        .match(ok, toToolError),

    uploadMedia: (input: { url?: string; base64?: string; alt: string; filename: string }): Promise<ToolResult> =>
      validateUploadAlt(input.alt)
        .asyncAndThen(() => resolveUploadSource(input))
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
          placeholder: `![media:${media.id}](${input.alt})`,
          url: media.url ?? undefined,
          note: '本文に画像を入れる場合は placeholder をそのまま貼る(括弧内は alt。変更すると media 側の alt も更新される)。thumbnail に使う場合は id を thumbnailMediaID に渡す。',
        }))
        .match(ok, toToolError),

    createUploadURL: (input: { filename: string; alt: string }): Promise<ToolResult> =>
      validateUploadAlt(input.alt)
        .andThen(() => validateUploadFilenameExtension(input.filename))
        .asyncAndThen(() => {
          const exp = Math.floor(Date.now() / 1000) + UPLOAD_URL_TTL_SECONDS;
          return fromPromise(
            signUploadURLParams(signingSecret, { userID: user.id, exp, filename: input.filename, alt: input.alt }),
            (cause) => new PayloadOperationError('署名の生成に失敗しました', { cause }),
          ).map((sig) => ({ exp, sig }));
        })
        .map(({ exp, sig }) => {
          const params = new URLSearchParams({ user: `${user.id}`, exp: `${exp}`, filename: input.filename, alt: input.alt, sig });
          const uploadURL = `${absoluteUrl('/api/media-upload')}?${params.toString()}`;
          return {
            uploadURL,
            method: 'POST',
            expiresAt: dayjs.unix(exp).tz('Asia/Tokyo').format(),
            curlExample: `curl -sS -X POST --data-binary @<ローカル画像のパス> '${uploadURL}'`,
            note: 'シェルで curlExample を実行する(@ の後を実ファイルパスに置換)。成功レスポンスの placeholder を本文にそのまま貼り、thumbnail には id を使う。上限 10MB、URL は発行から 10 分で失効。ワンタイムではないが期限内のみ有効。',
          };
        })
        .match(ok, toToolError),

    createPost: (input: { title: string; slug: string; excerpt: string; thumbnailMediaID: number; bodyMarkdown: string; publishedAt?: string }): Promise<ToolResult> =>
      // thumbnail 検証を prepareBody より先に行う: prepareBody は media doc alt 更新を
      // コミットする副作用を持つため、先に body を用意すると不正な thumbnailMediaID で
      // create が失敗した際に alt 変更だけが残ってしまう(update_post と揃えた順序)。
      // slug 重複チェックも同様に prepareBody より前 — 重複時に alt 副作用を走らせない。
      verifyMediaExistsOrFail(verifyMediaExists, input.thumbnailMediaID, `thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`)
        .andThen(() => requireSlugAvailable(payload, 'blog', input.slug, 'update_post'))
        .andThen(() => prepareBody(input.bodyMarkdown))
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
        .andThen((current) => resolveNextBody(input.bodyMarkdown, current.body))
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
    'list_media',
    {
      title: 'media 一覧',
      description:
        '登録済み media(画像)を新しい順に一覧する。search で filename / alt の部分一致検索。本文に既存画像を使うときはここで id と alt を確認し、返された placeholder(![media:<id>](alt))をそのまま貼る。',
      inputSchema: {
        search: z.string().min(1).optional().describe('filename / alt の部分一致キーワード。省略時は全件(新しい順)'),
        limit: z.number().int().min(1).max(50).optional().describe('最大件数(default 20)'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listMedia,
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
        '画像を media コレクションに登録し、本文用プレースホルダ ![media:<id>](alt) と thumbnail 用の id を返す。本文への画像埋め込み・thumbnail 指定の前に必ずこれを使う。サイズ上限は 10MB(超過時はエラーになるため事前に縮小・圧縮すること)。ローカルファイルパスから上げたい場合は create_upload_url を使う。',
      inputSchema: {
        url: z.string().url().optional().describe('取得元 URL(url か base64 のどちらか必須。ダウンロードサイズ上限 10MB)'),
        base64: z.string().optional().describe('画像バイナリの base64(デコード後サイズ上限 10MB)'),
        alt: z.string().min(1).refine(isRoundTrippableAlt, ALT_CLOSE_PAREN_MESSAGE).describe('代替テキスト(必須。半角 ")" は使用不可 — 全角「）」を使うこと)'),
        filename: z.string().min(1).describe('拡張子付きファイル名(例: cover.png)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.uploadMedia,
  );

  server.registerTool(
    'create_upload_url',
    {
      title: 'ローカルファイル用 upload URL 発行',
      description:
        'URL でも base64 でも渡せない手元のファイルを上げるときに使う。返る curlExample を Bash で実行するとアップロードされ、レスポンスに media id と placeholder が返る。url/base64 を直接渡せる場合は upload_media を使う。',
      inputSchema: {
        filename: z.string().min(1).describe('拡張子付きファイル名。jpg/jpeg/png/webp/gif/avif のみ'),
        alt: z.string().min(1).refine(isRoundTrippableAlt, ALT_CLOSE_PAREN_MESSAGE).describe('代替テキスト(必須。半角 ")" は使用不可 — 全角「）」を使うこと)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createUploadURL,
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
