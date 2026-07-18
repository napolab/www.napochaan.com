import { describe, expect, it } from 'vitest';

import { posterFormatCheckPlugin } from '.';

import type { FenceContext } from '..';

const ctx = (overrides: Partial<FenceContext>): FenceContext => ({
  fenceText: '```video variant=player poster=media:12\n![media:1]()\n```',
  body: '![media:1]()',
  props: '',
  variant: undefined,
  ...overrides,
});

describe('posterFormatCheckPlugin', () => {
  it('passes when there is no poster attribute (not applicable)', () => {
    expect(posterFormatCheckPlugin.run(ctx({ props: '' }))).toBeUndefined();
  });

  it('passes for a valid media:<id> value', () => {
    expect(posterFormatCheckPlugin.run(ctx({ props: 'poster=media:12' }))).toBeUndefined();
  });

  it('flags an invalid poster value format', () => {
    const error = posterFormatCheckPlugin.run(ctx({ props: 'poster=notmedia' }));
    expect(error).toContain('poster');
    expect(error).toContain('notmedia');
  });
});
