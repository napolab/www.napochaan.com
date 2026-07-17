import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { runPlugins } from '.';

import type { ImageRefPlugin } from '.';

describe('runPlugins', () => {
  it('returns the first plugin that matches (ok)', () => {
    const first: ImageRefPlugin = { run: () => ok({ kind: 'external', target: 'first', alt: '' }) };
    const second: ImageRefPlugin = { run: () => ok({ kind: 'external', target: 'second', alt: '' }) };
    const result = runPlugins('raw', [first, second]);
    expect(result._unsafeUnwrap()).toEqual({ kind: 'external', target: 'first', alt: '' });
  });

  it('falls through to the next plugin on err', () => {
    const first: ImageRefPlugin = { run: (raw) => err(raw) };
    const second: ImageRefPlugin = { run: () => ok({ kind: 'external', target: 'second', alt: '' }) };
    const result = runPlugins('raw', [first, second]);
    expect(result._unsafeUnwrap()).toEqual({ kind: 'external', target: 'second', alt: '' });
  });

  it('propagates the original raw as the error when every plugin errs', () => {
    const first: ImageRefPlugin = { run: (raw) => err(raw) };
    const second: ImageRefPlugin = { run: (raw) => err(raw) };
    const result = runPlugins('raw-value', [first, second]);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('raw-value');
  });

  it('errs with raw for an empty plugin list', () => {
    const result = runPlugins('raw-value', []);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('raw-value');
  });
});
