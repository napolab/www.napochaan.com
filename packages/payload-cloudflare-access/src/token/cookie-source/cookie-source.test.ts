import { describe, expect, test } from 'vitest';

import { cookieTokenSource } from './index';

describe('cookieTokenSource', () => {
  test('reads CF_Authorization among other cookies', () => {
    const headers = new Headers({ cookie: 'a=1; CF_Authorization=c; b=2' });

    expect(cookieTokenSource.run(headers)._unsafeUnwrap()).toEqual({ token: 'c', source: 'cookie' });
  });

  test('keeps "=" inside the cookie value', () => {
    const headers = new Headers({ cookie: 'CF_Authorization=x=y' });

    expect(cookieTokenSource.run(headers)._unsafeUnwrap()).toEqual({ token: 'x=y', source: 'cookie' });
  });

  test('does not match a cookie whose name only ends with CF_Authorization', () => {
    const headers = new Headers({ cookie: 'XCF_Authorization=c' });

    expect(cookieTokenSource.run(headers)._unsafeUnwrapErr()).toBe(headers);
  });

  test('returns err without the cookie', () => {
    const headers = new Headers({ cookie: 'a=1' });

    expect(cookieTokenSource.run(headers)._unsafeUnwrapErr()).toBe(headers);
  });

  test('returns err for an empty cookie value', () => {
    const headers = new Headers({ cookie: 'CF_Authorization=' });

    expect(cookieTokenSource.run(headers)._unsafeUnwrapErr()).toBe(headers);
  });
});
