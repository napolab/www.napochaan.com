import { describe, expect, it } from 'vitest';

import { runFenceChecks } from '.';

import type { FenceCheckPlugin, FenceContext } from '.';

const CTX: FenceContext = { fenceText: '```video\n![media:1]()\n```', body: '![media:1]()', props: '', variant: undefined };

describe('runFenceChecks', () => {
  it('returns no errors when every plugin passes', () => {
    const passing: FenceCheckPlugin = { run: () => undefined };
    expect(runFenceChecks(CTX, [passing, passing])).toEqual([]);
  });

  it('collects a single violation', () => {
    const failing: FenceCheckPlugin = { run: () => 'bad' };
    const passing: FenceCheckPlugin = { run: () => undefined };
    expect(runFenceChecks(CTX, [passing, failing])).toEqual(['bad']);
  });

  it('collects every violation instead of stopping at the first (collect-all, not first-match)', () => {
    const first: FenceCheckPlugin = { run: () => 'first violation' };
    const second: FenceCheckPlugin = { run: () => 'second violation' };
    expect(runFenceChecks(CTX, [first, second])).toEqual(['first violation', 'second violation']);
  });

  it('preserves plugin order in the result', () => {
    const a: FenceCheckPlugin = { run: () => 'a' };
    const b: FenceCheckPlugin = { run: () => 'b' };
    const c: FenceCheckPlugin = { run: () => 'c' };
    expect(runFenceChecks(CTX, [a, b, c])).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array for an empty plugin list', () => {
    expect(runFenceChecks(CTX, [])).toEqual([]);
  });
});
