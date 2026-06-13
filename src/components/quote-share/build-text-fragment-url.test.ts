import { describe, expect, it } from 'vitest';

import { buildTextFragmentUrl } from './build-text-fragment-url';

describe('buildTextFragmentUrl', () => {
  it('appends an encoded text fragment to the base url', () => {
    expect(buildTextFragmentUrl('https://www.napochaan.com/blog/1', 'hello world')).toBe('https://www.napochaan.com/blog/1#:~:text=hello%20world');
  });

  it('strips any existing fragment before appending', () => {
    expect(buildTextFragmentUrl('https://www.napochaan.com/blog/1#foo', 'hi')).toBe('https://www.napochaan.com/blog/1#:~:text=hi');
  });

  it('trims and percent-encodes reserved characters', () => {
    expect(buildTextFragmentUrl('https://x.test/p', '  a & b  ')).toBe('https://x.test/p#:~:text=a%20%26%20b');
  });

  it('caps the fragment to the first 200 characters', () => {
    const long = 'あ'.repeat(300);
    const result = buildTextFragmentUrl('https://x.test/p', long);
    expect(result).toBe(`https://x.test/p#:~:text=${encodeURIComponent('あ'.repeat(200))}`);
  });
});
