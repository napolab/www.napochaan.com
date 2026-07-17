import { describe, expect, it } from 'vitest';

import { placeholderPlugin } from '.';

describe('placeholderPlugin', () => {
  it('matches `media:<digits>` and captures the raw digit notation', () => {
    const result = placeholderPlugin.run('![media:5](left)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'placeholder', id: 5, rawID: '5', alt: 'left' });
  });

  it('preserves leading zeros in rawID while parsing id numerically', () => {
    const result = placeholderPlugin.run('![media:007](x)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'placeholder', id: 7, rawID: '007', alt: 'x' });
  });

  it('allows an empty alt (empty parens)', () => {
    const result = placeholderPlugin.run('![media:1]()');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'placeholder', id: 1, rawID: '1', alt: '' });
  });

  it('does not match a non-digit id suffix (`12x`)', () => {
    const result = placeholderPlugin.run('![media:12x](a)');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('![media:12x](a)');
  });

  it('does not match an empty id (`media:`)', () => {
    const result = placeholderPlugin.run('![media:]()');
    expect(result.isErr()).toBe(true);
  });

  it('does not match a non-placeholder ref', () => {
    const result = placeholderPlugin.run('![alt](https://example.com/x.png)');
    expect(result.isErr()).toBe(true);
  });
});
