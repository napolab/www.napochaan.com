import type { DownloadTokenInput } from './types';

export type { DownloadTokenInput } from './types';

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return bytes.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
};

const importKey = (secret: string): Promise<CryptoKey> => crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

const payloadOf = (input: DownloadTokenInput): string => `${input.releaseId}|${input.exp}`;

// Hex HMAC-SHA256 of `${releaseId}|${exp}` keyed by the shared secret (PAYLOAD_SECRET).
export const signDownloadToken = async (input: DownloadTokenInput, secret: string): Promise<string> => {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadOf(input)));
  return toHex(signature);
};

// Constant-time comparison: recompute the expected signature and compare byte-equal
// length-first. Returns false (never throws) on any malformed candidate.
export const verifyDownloadToken = async (input: DownloadTokenInput, sig: string, secret: string): Promise<boolean> => {
  const expected = await signDownloadToken(input, secret);
  if (expected.length !== sig.length) return false;
  const mismatch = Array.from(expected).reduce((acc, char, index) => acc | (char.charCodeAt(0) ^ sig.charCodeAt(index)), 0);
  return mismatch === 0;
};
