import { matchesSecret } from '@utils/safe-equal';

// Replaces Next draft mode (`draftMode()` + its `__prerender_bypass` cookie). The
// `/next/preview` handshake verifies PREVIEW_SECRET and sets this cookie; the preview
// pages render drafts only while it is present, valid and not expired. The value is
// `<issuedAt>.<HMAC(secret, 'draft-mode:<issuedAt>')>` (issuedAt in Unix seconds): never
// the secret itself, rotating the secret revokes every outstanding cookie, and the
// signed timestamp makes a leaked cookie expire after DRAFT_MAX_AGE_SECONDS.
export const DRAFT_COOKIE_NAME = 'napochaan_draft';

// One day. Also the cookie's Max-Age, so the browser drops it when the server would
// start rejecting it.
export const DRAFT_MAX_AGE_SECONDS = 86_400;

// Tolerated clock skew for a cookie stamped slightly ahead of this isolate's clock.
const FUTURE_SKEW_SECONDS = 60;

const DRAFT_MESSAGE_PREFIX = 'draft-mode:';

// The preview pages render inside the cms admin's Live Preview iframe, a cross-site
// context: only a `SameSite=None; Secure` cookie is sent there, and browsers that block
// third-party cookies still allow it when `Partitioned` (CHIPS, keyed by the cms site).
const COOKIE_ATTRIBUTES = 'HttpOnly; Secure; SameSite=None; Partitioned';

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

const toHex = (buffer: ArrayBuffer): string => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

// HMAC-SHA256(secret, 'draft-mode:<issuedAt>') as hex, via WebCrypto (Workers and Node alike).
const signIssuedAt = async (secret: string, issuedAt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${DRAFT_MESSAGE_PREFIX}${issuedAt}`)));
};

export const createDraftCookieValue = async (secret: string, issuedAt: number = nowSeconds()): Promise<string> => `${issuedAt}.${await signIssuedAt(secret, `${issuedAt}`)}`;

// The signed issue time, when the value is `<digits>.<mac>`.
const readIssuedAt = (value: string): string | undefined => {
  const match = /^(\d+)\.[0-9a-f]+$/.exec(value);

  return match?.[1];
};

const isFresh = (issuedAt: number, now: number): boolean => now - issuedAt <= DRAFT_MAX_AGE_SECONDS && issuedAt - now <= FUTURE_SKEW_SECONDS;

const readCookie = (cookieHeader: string | null, name: string): string | undefined => {
  if (cookieHeader === null) return undefined;
  const prefix = `${name}=`;
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return entry?.slice(prefix.length);
};

// Whether the request carries an unexpired draft cookie minted for `secret`. An empty
// secret never authorizes (WebCrypto also rejects a zero-length HMAC key). The whole
// value is compared in constant time (`matchesSecret`) against one re-signed from its
// own timestamp, so a rewritten timestamp fails the MAC.
export const isDraftEnabled = async (cookieHeader: string | null, secret: string, now: number = nowSeconds()): Promise<boolean> => {
  if (secret === '') return false;
  const submitted = readCookie(cookieHeader, DRAFT_COOKIE_NAME);
  if (submitted === undefined) return false;
  const issuedAt = readIssuedAt(submitted);
  if (issuedAt === undefined) return false;
  if (!isFresh(parseInt(issuedAt, 10), now)) return false;

  return matchesSecret(submitted, `${issuedAt}.${await signIssuedAt(secret, issuedAt)}`);
};

export const draftCookieHeader = async (secret: string, issuedAt: number = nowSeconds()): Promise<string> =>
  `${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(secret, issuedAt)}; Path=/; Max-Age=${DRAFT_MAX_AGE_SECONDS}; ${COOKIE_ATTRIBUTES}`;

// A partitioned cookie is only replaced by a Set-Cookie carrying the same partition
// attributes, so the clear repeats them.
export const clearDraftCookieHeader = (): string => `${DRAFT_COOKIE_NAME}=; Path=/; Max-Age=0; ${COOKIE_ATTRIBUTES}`;
