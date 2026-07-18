import { describe, expect, it } from 'vitest';

import { bodyCheckPlugin } from '.';

import type { FenceContext } from '..';

const ctx = (overrides: Partial<FenceContext>): FenceContext => ({
  fenceText: '```video\n![media:1]()\n```',
  body: '![media:1]()',
  props: '',
  variant: undefined,
  ...overrides,
});

describe('bodyCheckPlugin', () => {
  it('passes for a single valid media body line', () => {
    expect(bodyCheckPlugin.run(ctx({}))).toBeUndefined();
  });

  it('flags an empty body', () => {
    expect(bodyCheckPlugin.run(ctx({ body: '' }))).toContain('ちょうど1行');
  });

  it('flags a body with more than one line', () => {
    expect(bodyCheckPlugin.run(ctx({ body: '![media:1]()\n![media:2]()' }))).toContain('ちょうど1行');
  });

  it('flags a non-media body line', () => {
    expect(bodyCheckPlugin.run(ctx({ body: 'not a media line' }))).toContain('ちょうど1行');
  });

  it('includes the fenceText in the error message', () => {
    const fenceText = '```video\nnot a media line\n```';
    expect(bodyCheckPlugin.run(ctx({ body: 'not a media line', fenceText }))).toContain(fenceText);
  });
});
