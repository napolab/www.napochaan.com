// MCP blog tool の error channel。すべての失敗はここに集約する(modeling-errors-as-classes)。
// `override name` は noImplicitOverride 対応(Error.name の上書き)。判別は instanceof で行う —
// name は log / IPC シリアライズ後の wire 判別子用の安定 ID であって、in-process の判別子ではない。

// 入力が discriminated union にパースできない(id/slug どちらも未指定、url/base64 どちらも未指定 等)。
export class InvalidInputError extends Error {
  override name = 'InvalidInputError';
}

// 指定 id/slug の blog 記事が見つからない。
export class PostNotFoundError extends Error {
  override name = 'PostNotFoundError';
}

// 指定 id の media が見つからない。thumbnail / image-row cell の両方で使うため、
// メッセージは呼び出し側が渡す(文言がユースケースごとに異なるため)。
export class MediaNotFoundError extends Error {
  override name = 'MediaNotFoundError';
}

// 既存本文に MCP 非対応の block が含まれ、bodyMarkdown での上書きができない。
export class UnsupportedBlockError extends Error {
  override name = 'UnsupportedBlockError';
}

// 本文 Markdown の検証エラー(生 URL 画像参照 / image-row フェンス構文違反)。
export class BodyValidationError extends Error {
  override name = 'BodyValidationError';
}

// アップロード元 URL の形式・スキーム・ホストが不正(SSRF ガード)。
export class ImageURLError extends Error {
  override name = 'ImageURLError';
}

// アップロード元 URL の取得に失敗(リダイレクト・ネットワークエラー・非 2xx)。
export class ImageFetchError extends Error {
  override name = 'ImageFetchError';
}

// アップロード画像が上限サイズを超過(content-length 事前チェック or 受信量の実測)。
export class UploadTooLargeError extends Error {
  override name = 'UploadTooLargeError';
}

// アップロード画像の MIME type を特定できない。
export class MimeTypeError extends Error {
  override name = 'MimeTypeError';
}

// payload.* / codec.* が投げた例外を Result channel に折り込むラッパ。生の例外は
// `cause` に載せる(ToolResult には決して漏らさない)。edge (toToolError) 側で
// `cause instanceof ValidationError` ならフィールド単位の詳細メッセージを、
// それ以外は internal error 文言 + console.error でのログ出力を行う。
export class PayloadOperationError extends Error {
  override name = 'PayloadOperationError';
}

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
