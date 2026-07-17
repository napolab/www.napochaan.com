import type { ValidationError } from 'payload';

// MCP blog tool の error channel。すべての失敗はここに集約する(modeling-errors-as-classes)。
// `override name` は noImplicitOverride 対応(Error.name の上書き)。判別は instanceof で行う —
// name は log / IPC シリアライズ後の wire 判別子用の安定 ID であって、in-process の判別子ではない。
// `as const` でリテラル型化しているため、name は string-literal union の discriminant としても
// 使える(POST /api/media-upload の formatUploadError が name で switch する用途)。

// 入力が discriminated union にパースできない(id/slug どちらも未指定、url/base64 どちらも未指定 等)。
export class InvalidInputError extends Error {
  override name = 'InvalidInputError' as const;
}

// 指定 id/slug の blog 記事が見つからない。
export class PostNotFoundError extends Error {
  override name = 'PostNotFoundError' as const;
}

// 指定 id の media が見つからない。thumbnail / image-row cell の両方で使うため、
// メッセージは呼び出し側が渡す(文言がユースケースごとに異なるため)。
export class MediaNotFoundError extends Error {
  override name = 'MediaNotFoundError' as const;
}

// 既存本文に MCP 非対応の block が含まれ、bodyMarkdown での上書きができない。
export class UnsupportedBlockError extends Error {
  override name = 'UnsupportedBlockError' as const;
}

// 本文 Markdown の検証エラー(生 URL 画像参照 / image-row フェンス構文違反)。
export class BodyValidationError extends Error {
  override name = 'BodyValidationError' as const;
}

// アップロード元 URL の形式・スキーム・ホストが不正(SSRF ガード)。
export class ImageURLError extends Error {
  override name = 'ImageURLError' as const;
}

// アップロード元 URL の取得に失敗(リダイレクト・ネットワークエラー・非 2xx)。
export class ImageFetchError extends Error {
  override name = 'ImageFetchError' as const;
}

// アップロード画像が上限サイズを超過(content-length 事前チェック or 受信量の実測)。
export class UploadTooLargeError extends Error {
  override name = 'UploadTooLargeError' as const;
}

// アップロード画像の MIME type を特定できない。
export class MimeTypeError extends Error {
  override name = 'MimeTypeError' as const;
}

// 署名付き upload URL の期限切れ。
export class UploadURLExpiredError extends Error {
  override name = 'UploadURLExpiredError' as const;
}

// 署名付き upload URL の署名不一致・不正。
export class UploadURLSignatureError extends Error {
  override name = 'UploadURLSignatureError' as const;
}

// POST /api/media-upload のボディが 0 バイト(未送信/空送信)。
export class EmptyUploadBodyError extends Error {
  override name = 'EmptyUploadBodyError' as const;
}

// POST /api/media-upload の署名は正当だが、対応する user が見つからない
// (findByID -> null)。署名自体の検証は通っているため、失効/改竄と区別する。
export class UnknownUploadUserError extends Error {
  override name = 'UnknownUploadUserError' as const;
}

// payload.* / codec.* が投げた例外を Result channel に折り込むラッパ。生の例外は
// `cause` に載せる(ToolResult には決して漏らさない)。edge (toToolError) 側で
// `cause instanceof ValidationError` ならフィールド単位の詳細メッセージを、
// それ以外は internal error 文言 + console.error でのログ出力を行う。
export class PayloadOperationError extends Error {
  override name = 'PayloadOperationError' as const;
}

// PayloadOperationError.cause が ValidationError のときの、フィールド単位メッセージの
// 整形(house style)。tools/index.ts の toToolError と POST /api/media-upload の両方が使う —
// 同じ文言を 2 箇所で保守すると必ず乖離するため、ここに一本化する。
export const formatPayloadValidationError = (error: ValidationError): string => {
  const details = (error.data.errors ?? []).map((item) => `- ${item.path ?? '(field)'}: ${item.message}`).join('\n');
  return `Payload の入力検証に失敗しました:\n${details}\n該当フィールドを修正して再実行してください。`;
};

// UploadURLExpiredError / UploadURLSignatureError は POST /api/media-upload
// (src/lib/mcp/upload-url の verifyUploadURLParams)専用のエラーで、MCP tool 側
// (src/lib/mcp/tools)では一切生成されないため McpToolError には含めない。
export type McpToolError =
  | InvalidInputError
  | PostNotFoundError
  | MediaNotFoundError
  | UnsupportedBlockError
  | BodyValidationError
  | ImageURLError
  | ImageFetchError
  | UploadTooLargeError
  | MimeTypeError
  | PayloadOperationError;
