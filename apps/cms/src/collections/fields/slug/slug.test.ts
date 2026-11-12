import { describe, expect, it } from 'vitest';

import { slugField, validateSlug } from './index';

describe('validateSlug', () => {
  it('accepts lowercase kebab slugs', () => {
    expect(validateSlug('a')).toBe(true);
    expect(validateSlug('a-b')).toBe(true);
    expect(validateSlug('napochaan-v3-0-0')).toBe(true);
    expect(validateSlug('447records-tana')).toBe(true);
  });

  it('rejects empty / nullish', () => {
    expect(validateSlug('')).toBe('スラッグは必須です。');
    expect(validateSlug(undefined)).toBe('スラッグは必須です。');
    expect(validateSlug(null)).toBe('スラッグは必須です。');
  });

  it('rejects uppercase, underscores, leading/trailing/double hyphens, non-ascii', () => {
    for (const bad of ['Aa', 'a_b', '-a', 'a-', 'a--b', 'あ', 'a/b']) {
      expect(validateSlug(bad)).toBe('小文字英数字とハイフンのみ使用できます（先頭・末尾・連続ハイフン不可）。');
    }
  });
});

describe('slugField', () => {
  it('is a required unique sidebar text field named slug', () => {
    const field = slugField();
    expect(field).toMatchObject({ name: 'slug', type: 'text', required: true, unique: true, index: true });
  });
});
