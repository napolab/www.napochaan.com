import { describe, expect, it } from 'vitest';

import { toMediaKey } from './index';

describe('toMediaKey', () => {
  it('returns a plain filename unchanged', () => {
    expect(toMediaKey('a.png')).toBe('a.png');
    expect(toMediaKey('my photo (1).jpg')).toBe('my photo (1).jpg');
  });

  it.each(['a..png', 'photo..v2.png', '..a.png', 'a.png..'])('accepts %s (`..` inside a name is not a path segment)', (name) => {
    expect(toMediaKey(name)).toBe(name);
  });

  it.each([
    ['empty', ''],
    ['parent traversal', '../a.png'],
    ['current directory', '.'],
    ['parent directory', '..'],
    ['forward slash', 'a/b.png'],
    ['backslash', 'a\\b.png'],
    ['NUL', 'a\u0000.png'],
    ['newline', 'a\n.png'],
    ['unit separator U+001F', 'a\u001f.png'],
    ['DEL', 'a\u007f.png'],
  ])('rejects %s', (_label, name) => {
    expect(toMediaKey(name)).toBeUndefined();
  });
});
