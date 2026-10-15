import { describe, expect, test } from 'vitest';

import { headerTokenSource } from './index';

describe('headerTokenSource', () => {
  test('reads the Cf-Access-Jwt-Assertion header', () => {
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': 'h' });

    expect(headerTokenSource.run(headers)._unsafeUnwrap()).toEqual({ token: 'h', source: 'header' });
  });

  test('trims the header value', () => {
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': ' h ' });

    expect(headerTokenSource.run(headers)._unsafeUnwrap()).toEqual({ token: 'h', source: 'header' });
  });

  test('returns err without the header', () => {
    const headers = new Headers();

    expect(headerTokenSource.run(headers)._unsafeUnwrapErr()).toBe(headers);
  });

  test('returns err for an empty header value', () => {
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': '   ' });

    expect(headerTokenSource.run(headers)._unsafeUnwrapErr()).toBe(headers);
  });
});
