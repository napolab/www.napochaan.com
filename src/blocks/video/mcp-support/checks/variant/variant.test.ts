import { describe, expect, it } from 'vitest';

import { variantCheckPlugin } from '.';

import type { FenceContext } from '..';

const ctx = (overrides: Partial<FenceContext>): FenceContext => ({
  fenceText: '```video variant=ambient\n![media:1]()\n```',
  body: '![media:1]()',
  props: '',
  variant: undefined,
  ...overrides,
});

describe('variantCheckPlugin', () => {
  it('passes when variant is omitted (not applicable)', () => {
    expect(variantCheckPlugin.run(ctx({ variant: undefined }))).toBeUndefined();
  });

  it('passes for ambient', () => {
    expect(variantCheckPlugin.run(ctx({ variant: 'ambient' }))).toBeUndefined();
  });

  it('passes for player', () => {
    expect(variantCheckPlugin.run(ctx({ variant: 'player' }))).toBeUndefined();
  });

  it('flags an invalid variant value', () => {
    const error = variantCheckPlugin.run(ctx({ variant: 'loop' }));
    expect(error).toContain('ambient');
    expect(error).toContain('player');
    expect(error).toContain('loop');
  });
});
