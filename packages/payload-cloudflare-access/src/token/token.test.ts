import { describe, expect, test } from 'vitest';

import { extractAccessToken } from './index';

describe('extractAccessToken', () => {
  test('prefers the header over the cookie', () => {
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': 'h', cookie: 'CF_Authorization=c' });

    expect(extractAccessToken(headers)._unsafeUnwrap()).toEqual({ token: 'h', source: 'header' });
  });

  test('falls back to the cookie', () => {
    const headers = new Headers({ cookie: 'CF_Authorization=c' });

    expect(extractAccessToken(headers)._unsafeUnwrap()).toEqual({ token: 'c', source: 'cookie' });
  });

  test('returns err without header or cookie', () => {
    const headers = new Headers();

    expect(extractAccessToken(headers)._unsafeUnwrapErr()).toBe(headers);
  });
});
