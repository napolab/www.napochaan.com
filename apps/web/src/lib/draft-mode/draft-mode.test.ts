import { describe, expect, it } from 'vitest';

import { clearDraftCookieHeader, createDraftCookieValue, DRAFT_COOKIE_NAME, draftCookieHeader, isDraftEnabled } from './index';

const SECRET = 'right';

describe('createDraftCookieValue', () => {
  it('is the hex HMAC-SHA256 of "draft-mode" keyed by the secret', async () => {
    const { createHmac } = await import('node:crypto');
    const expected = createHmac('sha256', SECRET).update('draft-mode').digest('hex');

    expect(await createDraftCookieValue(SECRET)).toBe(expected);
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs per secret', async () => {
    expect(await createDraftCookieValue('a')).not.toBe(await createDraftCookieValue('b'));
  });
});

describe('isDraftEnabled', () => {
  const cookieFor = async (secret: string) => `${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(secret)}`;

  it('accepts the cookie minted for the configured secret', async () => {
    expect(await isDraftEnabled(await cookieFor(SECRET), SECRET)).toBe(true);
  });

  it('finds the cookie among others', async () => {
    expect(await isDraftEnabled(`a=1; ${await cookieFor(SECRET)}; motion=reduce`, SECRET)).toBe(true);
  });

  it('rejects a cookie minted for another secret', async () => {
    expect(await isDraftEnabled(await cookieFor('wrong'), SECRET)).toBe(false);
  });

  it('rejects a missing cookie header or cookie', async () => {
    expect(await isDraftEnabled(null, SECRET)).toBe(false);
    expect(await isDraftEnabled('a=1', SECRET)).toBe(false);
    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=`, SECRET)).toBe(false);
  });

  it('never authorizes when the configured secret is empty', async () => {
    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=`, '')).toBe(false);
    expect(await isDraftEnabled(`${DRAFT_COOKIE_NAME}=x`, '')).toBe(false);
  });
});

describe('Set-Cookie headers', () => {
  it('sets the cookie for the cross-site cms iframe (HttpOnly, Secure, SameSite=None, Partitioned, Path=/)', async () => {
    const header = await draftCookieHeader(SECRET);

    expect(header).toBe(`${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(SECRET)}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`);
  });

  it('clears it with the same attributes (a partitioned cookie is only deleted by a partitioned Set-Cookie)', () => {
    expect(clearDraftCookieHeader()).toBe(`${DRAFT_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`);
  });
});
