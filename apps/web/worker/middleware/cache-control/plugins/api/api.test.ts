import { describe, expect, it } from 'vitest';

import { PRIVATE_POLICY } from '../../policies';
import { apiPlugin } from './index';

describe('apiPlugin', () => {
  it.each(['/api/users/me', '/api/news', '/api/mcp', '/api/', '/api/media/file/a.jpg', '/%61pi/users/me', '/api%2Fusers'])('denies storage for %s', (pathname) => {
    expect(apiPlugin.run(pathname)._unsafeUnwrap()).toEqual({ kind: 'fill', policy: PRIVATE_POLICY });
  });

  it.each(['/api', '/apis/x', '/x/api/y', '/', '/admin', '/%2561pi/users'])('does not match %s', (pathname) => {
    expect(apiPlugin.run(pathname).isErr()).toBe(true);
  });

  it('returns the pathname as the err value on a miss', () => {
    expect(apiPlugin.run('/works')._unsafeUnwrapErr()).toBe('/works');
  });
});
