import { matchesSecret } from '@utils/safe-equal';

// Replaces Next draft mode (`draftMode()` + its `__prerender_bypass` cookie). The
// `/next/preview` handshake verifies PREVIEW_SECRET and sets this cookie; the preview
// pages render drafts only while it is present and valid. The value is derived from the
// secret (HMAC), so it is never the secret itself and rotating the secret revokes every
// outstanding cookie.
export const DRAFT_COOKIE_NAME = 'napochaan_draft';

const DRAFT_MESSAGE = 'draft-mode';

// The preview pages render inside the cms admin's Live Preview iframe, a cross-site
// context: only a `SameSite=None; Secure` cookie is sent there, and browsers that block
// third-party cookies still allow it when `Partitioned` (CHIPS, keyed by the cms site).
const COOKIE_ATTRIBUTES = 'HttpOnly; Secure; SameSite=None; Partitioned';

const toHex = (buffer: ArrayBuffer): string => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

// HMAC-SHA256(secret, 'draft-mode') as hex, via WebCrypto (Workers and Node alike).
export const createDraftCookieValue = async (secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(DRAFT_MESSAGE)));
};

const readCookie = (cookieHeader: string | null, name: string): string | undefined => {
  if (cookieHeader === null) return undefined;
  const prefix = `${name}=`;
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return entry?.slice(prefix.length);
};

// Whether the request carries the draft cookie minted for `secret`. An empty secret
// never authorizes (WebCrypto also rejects a zero-length HMAC key). Constant-time
// compare (`matchesSecret`).
export const isDraftEnabled = async (cookieHeader: string | null, secret: string): Promise<boolean> => {
  if (secret === '') return false;
  const submitted = readCookie(cookieHeader, DRAFT_COOKIE_NAME);
  if (submitted === undefined || submitted === '') return false;

  return matchesSecret(submitted, await createDraftCookieValue(secret));
};

export const draftCookieHeader = async (secret: string): Promise<string> => `${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(secret)}; Path=/; ${COOKIE_ATTRIBUTES}`;

// A partitioned cookie is only replaced by a Set-Cookie carrying the same partition
// attributes, so the clear repeats them.
export const clearDraftCookieHeader = (): string => `${DRAFT_COOKIE_NAME}=; Path=/; Max-Age=0; ${COOKIE_ATTRIBUTES}`;
