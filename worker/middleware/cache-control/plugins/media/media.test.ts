import { describe, expect, it } from 'vitest';

import { MEDIA_POLICY } from '../../policies';
import { mediaPlugin } from './index';

describe('mediaPlugin', () => {
  it.each(['/api/media/file/a.jpg', '/api/media/file/nested/b.png', '/api/media/file/'])('applies the media policy to %s', (pathname) => {
    expect(mediaPlugin.run(pathname)._unsafeUnwrap()).toBe(MEDIA_POLICY);
  });

  it.each(['/api/media', '/api/media/', '/api/media/file', '/api/users/me', '/x/api/media/file/a.jpg', '/', '/api/media/%66ile/a.jpg'])('does not match %s', (pathname) => {
    expect(mediaPlugin.run(pathname).isErr()).toBe(true);
  });

  it('returns the pathname as the err value on a miss', () => {
    expect(mediaPlugin.run('/works')._unsafeUnwrapErr()).toBe('/works');
  });
});
