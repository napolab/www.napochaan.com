import { describe, expect, test } from 'vitest';

import {
  ACCESS_LOGOUT_ENDPOINT_PATH,
  ACCESS_LOGOUT_PATH,
  PRERENDER_BYPASS_COOKIE_NAME,
  createAccessLogoutEndpoint,
  expiredDraftModeCookie,
  expiredPayloadTokenCookie,
  isSameSiteLogout,
  respondToAccessLogout,
} from './index';
import type { AccessLogoutContext } from './index';

import type { PayloadRequest, SanitizedCollectionConfig } from 'payload';

const SERVER_URL = 'https://napochaan.com';
const CSRF = [SERVER_URL];

// generateExpiredPayloadCookie は sanitize 済みの auth のうち cookies(domain / sameSite / secure)だけを読む。
// sanitize 済みの auth 全体は Payload の config build を通さないと作れないので、読まれる分だけを持つ形で代用する。
const authConfigWith = (cookies: { domain?: string; sameSite?: 'Lax' | 'None' | 'Strict'; secure?: boolean }): SanitizedCollectionConfig['auth'] =>
  ({ cookies: { sameSite: 'Lax', secure: true, ...cookies } }) as unknown as SanitizedCollectionConfig['auth'];

const sameOrigin = (): Headers => new Headers({ Origin: SERVER_URL, 'Sec-Fetch-Site': 'same-origin' });

const contextWith = (overrides: Partial<AccessLogoutContext> = {}): AccessLogoutContext => ({
  headers: sameOrigin(),
  csrf: CSRF,
  cookiePrefix: 'payload',
  authConfig: authConfigWith({}),
  ...overrides,
});

// handler は PayloadRequest を受けるが、読むのは headers と payload.config(csrf / cookiePrefix)と
// payload.collections[slug].config.auth だけ。Payload の req 全体は組めないので、その分だけを持つ形で代用する。
const requestWith = ({ headers = sameOrigin(), cookiePrefix = 'payload', domain }: { headers?: Headers; cookiePrefix?: string; domain?: string }): PayloadRequest =>
  ({
    headers,
    payload: {
      config: { csrf: CSRF, cookiePrefix },
      collections: { users: { config: { auth: authConfigWith({ domain }) } } },
    },
  }) as unknown as PayloadRequest;

describe('isSameSiteLogout', () => {
  test('allows the admin form POST from the same origin', () => {
    expect(isSameSiteLogout(contextWith())).toBe(true);
  });

  test('rejects a cross-site form POST', () => {
    expect(isSameSiteLogout(contextWith({ headers: new Headers({ Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' }) }))).toBe(false);
  });

  test('rejects a redirect-tainted Origin: null', () => {
    expect(isSameSiteLogout(contextWith({ headers: new Headers({ Origin: 'null', 'Sec-Fetch-Site': 'cross-site' }) }))).toBe(false);
  });
});

describe('expiredPayloadTokenCookie', () => {
  test('names the cookie from cookiePrefix and expires it', () => {
    const cookie = expiredPayloadTokenCookie(contextWith({ cookiePrefix: 'custom' }));

    expect(cookie).toMatch(/^custom-token=;/);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
    const expires = /Expires=([^;]+)/.exec(cookie)?.[1];
    expect(expires).toBeDefined();
    expect(new Date(`${expires}`).getTime()).toBeLessThan(Date.now());
  });

  // ブラウザは Domain が発行時と違う cookie を別物として扱う。sanitize 済みの auth.cookies.domain を使うこと。
  test('keeps the Domain the collection issues the cookie with', () => {
    expect(expiredPayloadTokenCookie(contextWith({ authConfig: authConfigWith({ domain: 'napochaan.com' }) }))).toContain('Domain=napochaan.com');
  });
});

describe('expiredDraftModeCookie', () => {
  test('expires the Next draft mode cookie with the attributes Next sets it with', () => {
    const cookie = expiredDraftModeCookie();

    expect(PRERENDER_BYPASS_COOKIE_NAME).toBe('__prerender_bypass');
    expect(cookie.split('; ')).toEqual([`${PRERENDER_BYPASS_COOKIE_NAME}=`, 'Path=/', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'Max-Age=0', 'HttpOnly', 'Secure', 'SameSite=None']);
  });
});

describe('respondToAccessLogout', () => {
  test('expires both cookies and 303-redirects to the Access logout', () => {
    const response = respondToAccessLogout(contextWith());

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe(ACCESS_LOGOUT_PATH);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.getSetCookie()).toEqual([expiredPayloadTokenCookie(contextWith()), expiredDraftModeCookie()]);
  });

  // Payload の handleEndpoints は応答 headers を `new Headers(...)` で作り直す(utilities/mergeHeaders.js)。
  // Set-Cookie が 1 本に潰れずに 2 本のまま残ることを固定する。
  test('keeps both Set-Cookie headers through a Headers copy', () => {
    const response = respondToAccessLogout(contextWith());

    expect(new Headers(response.headers).getSetCookie()).toHaveLength(2);
  });

  test.each<{ flow: string; headers: Record<string, string> }>([
    { flow: 'cross-site form POST', headers: { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' } },
    { flow: 'cross-site request without Origin', headers: { 'Sec-Fetch-Site': 'cross-site' } },
  ])('rejects a $flow with 403 and no cookie changes', ({ headers }) => {
    const response = respondToAccessLogout(contextWith({ headers: new Headers(headers) }));

    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(response.headers.get('Location')).toBeNull();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('createAccessLogoutEndpoint', () => {
  test('is a POST collection endpoint at /access-logout', () => {
    const endpoint = createAccessLogoutEndpoint('users');

    expect(ACCESS_LOGOUT_ENDPOINT_PATH).toBe('/access-logout');
    expect(endpoint).toMatchObject({ path: ACCESS_LOGOUT_ENDPOINT_PATH, method: 'post' });
  });

  test('reads csrf, cookiePrefix and the sanitized auth config from the request', async () => {
    const response = await createAccessLogoutEndpoint('users').handler(requestWith({ cookiePrefix: 'custom', domain: 'napochaan.com' }));
    const [payloadCookie] = response.headers.getSetCookie();

    expect(response.status).toBe(303);
    expect(payloadCookie).toMatch(/^custom-token=;/);
    expect(payloadCookie).toContain('Domain=napochaan.com');
  });

  test('rejects a cross-site request without touching cookies', async () => {
    const response = await createAccessLogoutEndpoint('users').handler(requestWith({ headers: new Headers({ Origin: 'https://evil.example' }) }));

    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
