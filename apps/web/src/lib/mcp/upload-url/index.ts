import { errAsync, fromPromise, okAsync } from 'neverthrow';

import { UploadURLExpiredError, UploadURLSignatureError } from '../errors';

import type { ResultAsync } from 'neverthrow';

// Workers の isolate メモリ保護。media は画像/PDF 想定(旧 tools/index.ts から移設)。
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

export const resolveMimetypeFromFilename = (filename: string): string | undefined => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return isImageExtension(ext) ? MIME_BY_EXT[ext] : undefined;
};

// create_upload_url が発行してから POST /api/media-upload に届くまでの許容時間(秒)。
export const UPLOAD_URL_TTL_SECONDS = 600;

export type UploadURLParams = { userID: number; exp: number; filename: string; alt: string };

// 署名対象の正規化メッセージ。先頭の "media-upload" は他用途の HMAC 署名との
// ドメイン分離用 prefix(同じ secret を使う別の署名スキームと値が衝突しないようにする)。
// filename / alt は可変長かつ利用者が自由に書ける文字列で、区切りに使う "\n" 自体を
// 含み得る。生のまま連結すると、あるフィールドの末尾に "\n" を混ぜて次フィールドへ
// 文字をはみ出させることで、別のパラメータ組が同一メッセージに潰れてしまう
// (例: filename="a\nb", alt="c" と filename="a", alt="b\nc" が同じメッセージになる)。
// encodeURIComponent は "\n" を "%0A" に、"%" 自身も "%25" にエスケープするため、
// この変換は単射(injective)— 区切り文字の注入によるフィールド境界の押し出しを防ぐ。
const buildCanonicalMessage = (params: UploadURLParams): string => `media-upload\n${params.userID}\n${params.exp}\n${encodeURIComponent(params.filename)}\n${encodeURIComponent(params.alt)}`;

const textEncoder = new TextEncoder();

// Web Crypto(globalThis.crypto.subtle)のみを使う — node:crypto は Cloudflare Workers
// ランタイムに存在しないため、Node/Workers 両方で動く共通実装として避ける。
const importHMACKey = (secret: string): Promise<CryptoKey> => globalThis.crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export const signUploadURLParams = async (secret: string, params: UploadURLParams): Promise<string> => {
  const key = await importHMACKey(secret);
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, textEncoder.encode(buildCanonicalMessage(params)));
  return Buffer.from(signature).toString('hex');
};

// 16 進ペアの繰り返しのみ許容(大文字小文字は許容、空文字・奇数長は不可)。
const HEX_STRING = /^(?:[0-9a-f]{2})+$/i;

// hex 文字列 -> bytes は Buffer の 'hex' codec に任せる。ただし Buffer.from(x, 'hex')
// は不正入力で throw せず黙って途中まで decode するため、事前の全文 regex 検証が必須
// (不正は undefined = 署名不正として扱う。throw しない)。Uint8Array.from で包むのは
// Buffer の基盤が ArrayBufferLike 型で crypto.subtle の BufferSource に直接渡せないため。
const decodeHex = (hex: string): Uint8Array<ArrayBuffer> | undefined => (HEX_STRING.test(hex) ? Uint8Array.from(Buffer.from(hex, 'hex')) : undefined);

const EXPIRED_MESSAGE = '署名付き upload URL の有効期限が切れています。create_upload_url で再発行してください。';
const SIGNATURE_MESSAGE = '署名付き upload URL の署名が不正です。create_upload_url で再発行してください。';

// exp 検証(期限切れは署名検証より先に弾く — spec 通りの順序)。
const rejectIfExpired = (params: UploadURLParams, nowSeconds: number): ResultAsync<UploadURLParams, UploadURLExpiredError> =>
  params.exp < nowSeconds ? errAsync(new UploadURLExpiredError(EXPIRED_MESSAGE)) : okAsync(params);

// crypto.subtle.verify は定数時間比較を行う(sig 長が digest 長と異なる場合も
// throw せず false を返す — decodeHex 済みの bytes をそのまま渡せば安全)。
const verifySignatureBytes = async (secret: string, params: UploadURLParams, sigBytes: Uint8Array<ArrayBuffer>): Promise<boolean> => {
  const key = await importHMACKey(secret);
  return globalThis.crypto.subtle.verify('HMAC', key, sigBytes, textEncoder.encode(buildCanonicalMessage(params)));
};

// hex デコード(小関数)→ Web Crypto 検証(小関数)の合成。デコード失敗・検証失敗の
// いずれも同一の UploadURLSignatureError に落とす(呼び出し側からは区別不要)。
const verifySignature = (secret: string, params: UploadURLParams, sig: string): ResultAsync<void, UploadURLSignatureError> => {
  const sigBytes = decodeHex(sig);
  if (sigBytes === undefined) return errAsync(new UploadURLSignatureError(SIGNATURE_MESSAGE));
  return fromPromise(verifySignatureBytes(secret, params, sigBytes), () => new UploadURLSignatureError(SIGNATURE_MESSAGE)).andThen((valid) =>
    valid ? okAsync(undefined) : errAsync(new UploadURLSignatureError(SIGNATURE_MESSAGE)),
  );
};

// 署名付き upload URL のパラメータを検証する。exp 切れを先に判定し(rejectIfExpired)、
// 通過したもののみ署名検証(verifySignature)へ進む — 小関数の andThen 合成。
export const verifyUploadURLParams = (secret: string, params: UploadURLParams, sig: string, nowSeconds: number): ResultAsync<void, UploadURLExpiredError | UploadURLSignatureError> =>
  rejectIfExpired(params, nowSeconds).andThen(() => verifySignature(secret, params, sig));
