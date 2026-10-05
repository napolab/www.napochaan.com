// Pins the cookie CSRF decision table of Payload 3.84.1 (`dist/auth/extractJWT.js`, the `cookie`
// extraction method): Origin allowlist first, then no-allowlist passthrough, then Sec-Fetch-Site.
import { describe, expect, test } from 'vitest';

import { isAllowedCookieRequest } from './index';

const csrf = ['https://napochaan.com'];

describe('isAllowedCookieRequest', () => {
  test('allows a listed Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ Origin: 'https://napochaan.com' }), csrf)).toBe(true);
  });

  test('rejects an unlisted Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ Origin: 'https://evil.example' }), csrf)).toBe(false);
  });

  test('allows any Origin when csrf is empty', () => {
    expect(isAllowedCookieRequest(new Headers({ Origin: 'https://evil.example' }), [])).toBe(true);
  });

  test('allows same-origin fetch without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'same-origin' }), csrf)).toBe(true);
  });

  test('allows same-site fetch without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'same-site' }), csrf)).toBe(true);
  });

  test('allows direct navigation without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'none' }), csrf)).toBe(true);
  });

  test('rejects cross-site fetch without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'cross-site' }), csrf)).toBe(false);
  });

  test('rejects a request with neither Origin nor Sec-Fetch-Site', () => {
    expect(isAllowedCookieRequest(new Headers(), csrf)).toBe(false);
  });
});
