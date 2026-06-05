import { describe, expect, it } from 'vitest';

import { clsx } from './index';

describe('clsx', () => {
  it('joins truthy class names with a space', () => {
    expect(clsx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops undefined values', () => {
    expect(clsx('a', undefined, 'c')).toBe('a c');
  });

  it('drops empty strings', () => {
    expect(clsx('a', '', 'c')).toBe('a c');
  });
});
