import { describe, expect, it } from 'vitest';

import { resolveMarkdownTwinPath } from './index';

describe('resolveMarkdownTwinPath', () => {
  it.each([
    ['/', '/llms.txt'],
    ['//', '/llms.txt'],
    ['/about', '/about.md'],
    ['/about/', '/about.md'],
    ['/blog/hello-world', '/blog/hello-world.md'],
    ['/blog/hello-world/', '/blog/hello-world.md'],
    ['/gallery', '/gallery.md'],
  ])('%s → %s', (pathname, expected) => {
    expect(resolveMarkdownTwinPath(pathname)).toBe(expected);
  });
});
