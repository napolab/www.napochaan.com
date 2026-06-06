import { describe, expect, it } from 'vitest';

import { pathToRoom } from './room';

describe('pathToRoom', () => {
  it('maps the root path to a stable slug', () => {
    expect(pathToRoom('/')).toBe('root');
  });

  it('slugifies nested paths into a single slash-free segment', () => {
    expect(pathToRoom('/about')).toBe('about');
    expect(pathToRoom('/blog/post-1')).toBe('blog-post-1');
    expect(pathToRoom('/a/b/c')).not.toContain('/');
  });
});
