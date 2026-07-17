import { zValidator } from '@hono/zod-validator';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { handle } from 'hono/vercel';
import { err, errAsync, fromPromise, ok, okAsync } from 'neverthrow';
import { ValidationError } from 'payload';
import { z } from 'zod';

import { EmptyUploadBodyError, formatPayloadValidationError, MimeTypeError, PayloadOperationError, UnknownUploadUserError, UploadURLExpiredError, UploadURLSignatureError } from '@lib/mcp/errors';
import { MAX_UPLOAD_BYTES, resolveMimetypeFromFilename, verifyUploadURLParams } from '@lib/mcp/upload-url';
import { getPayloadClient } from '@lib/payload/client';

import type { Media, User } from '@payload-types';
import type { Context } from 'hono';
import type { Result, ResultAsync } from 'neverthrow';
import type { Payload } from 'payload';

// このパスは意図的に /api/mcp の外に置く — /api/mcp/* は worker の mcp-guard が
// 公開側から 404 遮断するため。認可はクエリの HMAC 署名(create_upload_url が発行)
// のみで行う。

const MISSING_PARAM_MESSAGE = 'user, exp, filename, alt, sig は全て必須です。create_upload_url で発行した URL をそのまま使用してください。';
const INVALID_NUMBER_MESSAGE = 'user, exp は数値で指定してください。create_upload_url で発行した URL をそのまま使用してください。';
const MIME_TYPE_MESSAGE = 'filename の拡張子から MIME type を特定できません(対応: jpg / jpeg / png / webp / gif / avif)。正しい拡張子付きの filename で create_upload_url を発行し直してください。';
const TOO_LARGE_MESSAGE = '画像が大きすぎます(上限 10MB)。縮小・圧縮してから再実行してください。';
const EMPTY_BODY_MESSAGE = 'ファイルが空です。画像データを body にセットして再送してください。';
const UNKNOWN_USER_MESSAGE = '指定された user が見つかりません。create_upload_url を発行したユーザーで再実行してください。';
const INTERNAL_ERROR_MESSAGE = '内部エラーが発生しました。時間をおいて再実行してください。';
const SUCCESS_NOTE = '本文にはこの placeholder をそのまま貼る。thumbnail には id を thumbnailMediaID に渡す。';

// user / exp は「数字のみの文字列」を要求する(z.coerce.number は不使用 — parseFloat 等の
// 緩い変換規則を経由させず、桁の見た目どおりの値だけを受理するため)。
const digitsToInt = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => parseInt(value, 10));

const querySchema = z.object({
  user: digitsToInt,
  exp: digitsToInt,
  filename: z.string().min(1),
  alt: z.string().min(1),
  sig: z.string().min(1),
});

type ParsedQuery = z.infer<typeof querySchema>;

const REQUIRED_QUERY_KEYS = ['user', 'exp', 'filename', 'alt', 'sig'] as const;

// 旧 readRawParams と同じ判定(1つでも未指定/空文字なら false)。zValidator の
// hook から呼び、「未指定/空」と「指定はあるが数値として不正」の 2 つの 400 を
// 呼び分ける(前者を優先する既存の優先順位を保つ)。
const hasAllRequiredQueryParams = (c: Context): boolean =>
  REQUIRED_QUERY_KEYS.every((key) => {
    const value = c.req.query(key);
    return value !== undefined && value !== '';
  });

// 発行時点では拡張子を検証済みのはずだが、境界を跨ぐ入力は常に fail closed で
// 再検証する(署名は filename の拡張子妥当性までは保証しない)。
const resolveMimetype = (filename: string): Result<string, MimeTypeError> => {
  const mimetype = resolveMimetypeFromFilename(filename);
  return mimetype === undefined ? err(new MimeTypeError(MIME_TYPE_MESSAGE)) : ok(mimetype);
};

const findUploadUser = (payload: Payload, userID: number): ResultAsync<User, UnknownUploadUserError | PayloadOperationError> =>
  fromPromise(payload.findByID({ collection: 'users', id: userID, disableErrors: true, overrideAccess: true }), (cause) => new PayloadOperationError('user 取得に失敗しました', { cause })).andThen(
    (user) => (user === null ? errAsync(new UnknownUploadUserError(UNKNOWN_USER_MESSAGE)) : okAsync(user)),
  );

const createMediaDoc = (payload: Payload, user: User, parsed: ParsedQuery, mimetype: string, data: ArrayBuffer): ResultAsync<Media, PayloadOperationError> =>
  fromPromise(
    payload.create({
      collection: 'media',
      data: { alt: parsed.alt },
      file: { data: Buffer.from(data), mimetype, name: parsed.filename, size: data.byteLength },
      overrideAccess: false,
      user,
    }),
    (cause) => new PayloadOperationError('media 作成に失敗しました', { cause }),
  );

// このルートで生成され得るエラー全種(署名検証 edge / ハンドラ edge の両方)。
type UploadRouteError = UploadURLExpiredError | UploadURLSignatureError | MimeTypeError | EmptyUploadBodyError | UnknownUploadUserError | PayloadOperationError;

type FormattedUploadError = { status: 400 | 401 | 410 | 500; message: string };

// 循環した cause チェーン(error.cause === error 等)での再帰暴走を防ぐ深さ上限。
const MAX_CAUSE_DEPTH = 8;

// PayloadOperationError.cause を再帰的に辿り、ValidationError が現れた最初の階層で
// 400 に畳む。cause チェーンの途中に(ラップ用の)素の Error が挟まっていても、
// そのさらに cause を辿り続ける(ユーザー指示: 「cause も触れるように再帰関数にしたい」)。
const formatUploadErrorCause = (cause: unknown, depth = 0): FormattedUploadError | undefined => {
  if (depth >= MAX_CAUSE_DEPTH) return undefined;
  if (cause instanceof ValidationError) return { status: 400, message: formatPayloadValidationError(cause) };
  if (cause instanceof Error) return formatUploadErrorCause(cause.cause, depth + 1);
  return undefined;
};

// エラー→ステータス/メッセージの対応。name は as const でリテラル型化済みなので、
// string-literal union の discriminant として switch で分岐できる
// (branching-modeled-state-with-switch)。default は置かず、tsgo の網羅性検査
// (switch 後に到達不能な分岐がなければ全パス return 済みと判定される)に委ねる。
// PayloadOperationError だけ cause の中身次第で 400/500 が分かれるため、
// cause 側の判定は再帰の formatUploadErrorCause に委譲する。
const formatUploadError = (error: UploadRouteError): FormattedUploadError => {
  switch (error.name) {
    case 'UploadURLExpiredError':
      return { status: 410, message: error.message };
    case 'UploadURLSignatureError':
      return { status: 401, message: error.message };
    case 'MimeTypeError':
      return { status: 400, message: error.message };
    case 'EmptyUploadBodyError':
      return { status: 400, message: error.message };
    case 'UnknownUploadUserError':
      return { status: 401, message: error.message };
    case 'PayloadOperationError':
      return formatUploadErrorCause(error.cause) ?? { status: 500, message: INTERNAL_ERROR_MESSAGE };
  }
};

// 署名検証 edge / ハンドラ edge 共通のレスポンス整形。500(internal fallback)の
// ときだけ、元の cause チェーンをそのまま(整形後オブジェクトではなく)ログに残す —
// 旧 toErrorResponse の console.error 文言・タイミングを踏襲。
const toUploadErrorResponse = (c: Context, error: UploadRouteError): Response => {
  const formatted = formatUploadError(error);
  if (formatted.status === 500) console.error('[media-upload] media 作成に失敗しました', error.cause);
  return c.json({ error: formatted.message }, formatted.status);
};

const app = new Hono();

app.post(
  '/api/media-upload',
  zValidator('query', querySchema, (result, c) => {
    if (result.success) return undefined;
    if (!hasAllRequiredQueryParams(c)) return c.json({ error: MISSING_PARAM_MESSAGE }, 400);
    return c.json({ error: INVALID_NUMBER_MESSAGE }, 400);
  }),
  // 署名検証は bodyLimit より前 — 無署名/不正署名のリクエストで body を buffering
  // しないため(順序それ自体が認可境界の一部)。署名の唯一のソースは
  // create_upload_url が発行時に使った secret(Payload 自体の secret を流用)。
  // ここが実質的な認可境界であり、他に認証手段は存在しない(fail closed)。
  async (c, next) => {
    const parsed = c.req.valid('query');
    const { env } = await getCloudflareContext({ async: true });
    return verifyUploadURLParams(env.PAYLOAD_SECRET, { userID: parsed.user, exp: parsed.exp, filename: parsed.filename, alt: parsed.alt }, parsed.sig, Math.floor(Date.now() / 1000)).match(
      () => next(),
      (error) => toUploadErrorResponse(c, error),
    );
  },
  bodyLimit({ maxSize: MAX_UPLOAD_BYTES, onError: (c) => c.json({ error: TOO_LARGE_MESSAGE }, 413) }),
  async (c) => {
    const parsed = c.req.valid('query');
    const data = await c.req.arrayBuffer();

    return resolveMimetype(parsed.filename)
      .andThen((mimetype) => (data.byteLength === 0 ? err(new EmptyUploadBodyError(EMPTY_BODY_MESSAGE)) : ok(mimetype)))
      .asyncAndThen((mimetype) =>
        fromPromise(getPayloadClient(), (cause) => new PayloadOperationError('Payload client の初期化に失敗しました', { cause })).andThen((payload) =>
          findUploadUser(payload, parsed.user).map((user) => ({ payload, mimetype, user })),
        ),
      )
      .andThen(({ payload, user, mimetype }) => createMediaDoc(payload, user, parsed, mimetype, data))
      .match(
        (media) =>
          c.json(
            {
              id: media.id,
              placeholder: `![media:${media.id}](${parsed.alt})`,
              url: media.url ?? undefined,
              note: SUCCESS_NOTE,
            },
            201,
          ),
        (error) => toUploadErrorResponse(c, error),
      );
  },
);

export const POST = handle(app);
