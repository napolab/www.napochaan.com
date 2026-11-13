import { describe, expect, it } from 'vitest';

import { clearDraftCookieHeader, createDraftCookieValue, DRAFT_COOKIE_NAME, DRAFT_MAX_AGE_SECONDS, draftCookieHeader, isDraftEnabled } from './index';

const SECRET = 'right';
const ISSUED_AT = 1_800_000_000;

describe('createDraftCookieValue', () => {
  it('is `<issuedAt>.<hex HMAC-SHA256 of "draft-mode:<issuedAt>">` keyed by the secret', async () => {
    const { createHmac } = await import('node:crypto');
    const mac = createHmac('sha256', SECRET).update(`draft-mode:${ISSUED_AT}`).digest('hex');

    expect(await createDraftCookieValue(SECRET, ISSUED_AT)).toBe(`${ISSUED_AT}.${mac}`);
    expect(mac).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs per secret and per issue time', async () => {
    expect(await createDraftCookieValue('a', ISSUED_AT)).not.toBe(await createDraftCookieValue('b', ISSUED_AT));
    expect(await createDraftCookieValue(SECRET, ISSUED_AT)).not.toBe(await createDraftCookieValue(SECRET, ISSUED_AT + 1));
  });
});

describe('isDraftEnabled', () => {
  const cookieFor = async (secret: string, issuedAt = ISSUED_AT) => `${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(secret, issuedAt)}`;

  it('accepts a fresh cookie minted for the configured secret', async () => {
    expect(await isDraftEnabled(await cookieFor(SECRET), SECRET, ISSUED_AT + 60)).toBe(true);
  });

  it('accepts it up to the max age', async () => {
    expect(await isDraftEnabled(await cookieFor(SECRET), SECRET, ISSUED_AT + DRAFT_MAX_AGE_SECONDS)).toBe(true);
  });

  it('rejects an expired cookie', async () => {
    expect(await isDraftEnabled(await cookieFor(SECRET), SECRET, ISSUED_AT + DRAFT_MAX_AGE_SECONDS + 1)).toBe(false);
  });

  it('rejects a cookie issued in the future (beyond clock skew)', async () => {
    expect(await isDraftEnabled(await cookieFor(SECRET, ISSUED_AT + 3600), SECRET, ISSUED_AT)).toBe(false);
  });

  it('rejects a tampered timestamp (an old cookie cannot be refreshed without the secret)', async () => {
    const value = await createDraftCookieValue(SECRET, ISSUED_AT);
    const mac = value.slice(value.indexOf('.') + 1);
    const now = ISSUED_AT + DRAFT_MAX_AGE_SECONDS + 100;

    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=${now}.${mac}`, SECRET, now)).toBe(false);
  });

  it('rejects malformed values', async () => {
    const value = await createDraftCookieValue(SECRET, ISSUED_AT);
    const mac = value.slice(value.indexOf('.') + 1);

    for (const malformed of [mac, `+${ISSUED_AT}.${mac}`, `${ISSUED_AT}.`, `.${mac}`, `${ISSUED_AT}x.${mac}`]) {
      expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=${malformed}`, SECRET, ISSUED_AT)).toBe(false);
    }
  });

  it('finds the cookie among others', async () => {
    expect(await isDraftEnabled(`a=1; ${await cookieFor(SECRET)}; motion=reduce`, SECRET, ISSUED_AT)).toBe(true);
  });

  it('rejects a cookie minted for another secret', async () => {
    expect(await isDraftEnabled(await cookieFor('wrong'), SECRET, ISSUED_AT)).toBe(false);
  });

  it('rejects a missing cookie header or cookie', async () => {
    expect(await isDraftEnabled(null, SECRET, ISSUED_AT)).toBe(false);
    expect(await isDraftEnabled('a=1', SECRET, ISSUED_AT)).toBe(false);
    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=`, SECRET, ISSUED_AT)).toBe(false);
  });

  it('never authorizes when the configured secret is empty', async () => {
    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=`, '', ISSUED_AT)).toBe(false);
    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=x`, '', ISSUED_AT)).toBe(false);
  });

  it('defaults `now` to the current time', async () => {
    const issuedNow = Math.floor(Date.now() / 1000);

    expect(await isDraftEnabled(await cookieFor(SECRET, issuedNow), SECRET)).toBe(true);
  });
});

describe('Set-Cookie headers', () => {
  it('sets the cookie for the cross-site cms iframe (HttpOnly, Secure, SameSite=None, Partitioned, Path=/) with a matching Max-Age', async () => {
    const header = await draftCookieHeader(SECRET, ISSUED_AT);

    expect(header).toBe(`${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(SECRET, ISSUED_AT)}; Path=/; Max-Age=${DRAFT_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=None; Partitioned`);
  });

  it('expires after one day', () => {
    expect(DRAFT_MAX_AGE_SECONDS).toBe(86_400);
  });

  it('clears it with the same attributes (a partitioned cookie is only deleted by a partitioned Set-Cookie)', () => {
    expect(clearDraftCookieHeader()).toBe(`${DRAFT_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`);
  });
});
