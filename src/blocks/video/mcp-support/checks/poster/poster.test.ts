import { describe, expect, it } from 'vitest';

import { posterCheckPlugin } from '.';

import type { FenceContext } from '..';

const ctx = (overrides: Partial<FenceContext>): FenceContext => ({
  fenceText: '```video variant=player poster=media:5\n![media:1]()\n```',
  body: '![media:1]()',
  props: '',
  variant: undefined,
  ...overrides,
});

describe('posterCheckPlugin', () => {
  it('passes when there is no poster attribute (not applicable)', () => {
    expect(posterCheckPlugin.run(ctx({ props: '', variant: undefined }))).toBeUndefined();
  });

  it('passes when poster is set and variant is player', () => {
    expect(posterCheckPlugin.run(ctx({ props: 'poster=media:5', variant: 'player' }))).toBeUndefined();
  });

  it('flags poster set with variant ambient', () => {
    const error = posterCheckPlugin.run(ctx({ props: 'poster=media:5', variant: 'ambient' }));
    expect(error).toContain('player');
  });

  it('flags poster set with no variant attribute (implicit ambient)', () => {
    const error = posterCheckPlugin.run(ctx({ props: 'poster=media:5', variant: undefined }));
    expect(error).toContain('player');
  });
});
