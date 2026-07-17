import { describe, expect, it } from 'vitest';

import { externalPlugin } from '.';

describe('externalPlugin', () => {
  it('always matches, capturing alt and target as-is', () => {
    const result = externalPlugin.run('![alt](https://example.com/x.png)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'external', target: 'https://example.com/x.png', alt: 'alt' });
  });

  it('matches empty parens with target = ""', () => {
    const result = externalPlugin.run('![x]()');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'external', target: '', alt: 'x' });
  });

  it('matches a malformed placeholder id as external', () => {
    const result = externalPlugin.run('![media:12x](a)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'external', target: 'a', alt: 'media:12x' });
  });
});
