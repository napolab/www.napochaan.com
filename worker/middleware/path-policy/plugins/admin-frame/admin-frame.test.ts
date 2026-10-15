import { describe, expect, it } from 'vitest';

import { adminFramePlugin, SAME_ORIGIN_FRAMING } from './index';

const run = (pathname: string) => adminFramePlugin.run({ method: 'GET', pathname, headers: new Headers() });

describe('adminFramePlugin', () => {
  it.each(['/admin', '/admin/', '/admin/collections/blog/1'])('allows only same-origin framing of %s', (pathname) => {
    expect(run(pathname)._unsafeUnwrap()).toEqual({ kind: 'frame', policy: SAME_ORIGIN_FRAMING });
  });

  it.each(['/', '/administrator', '/adminx', '/oauth/authorize', '/oauth/token', '/api/users/me', '/next/preview'])('leaves %s alone', (pathname) => {
    expect(run(pathname).isErr()).toBe(true);
  });

  it('returns the request as the err value on a miss', () => {
    const input = { method: 'GET', pathname: '/', headers: new Headers() };

    expect(adminFramePlugin.run(input)._unsafeUnwrapErr()).toBe(input);
  });

  it('frames regardless of method', () => {
    expect(adminFramePlugin.run({ method: 'POST', pathname: '/admin/x', headers: new Headers() }).isOk()).toBe(true);
  });
});
