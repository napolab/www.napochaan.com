import { err, ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';

import { createRunner, when } from './index';

import type { Plugin } from './index';

const miss: Plugin<string, number> = { run: (input) => err(input) };

const createHit = (value: number): Plugin<string, number> => ({ run: vi.fn(() => ok(value)) });

describe('createRunner', () => {
  it('returns the first ok and does not consult later plugins', () => {
    const hitA = createHit(1);
    const hitB = createHit(2);

    const result = createRunner([miss, hitA, hitB])('x');

    expect(result._unsafeUnwrap()).toBe(1);
    expect(hitB.run).not.toHaveBeenCalled();
  });

  it('returns err with the input when nothing matches', () => {
    const input = { path: '/x' };
    const plugin: Plugin<typeof input, number> = { run: (value) => err(value) };

    expect(createRunner([plugin, plugin])(input)._unsafeUnwrapErr()).toBe(input);
  });

  it('returns err with the input for an empty list', () => {
    expect(createRunner<string, number>([])('x')._unsafeUnwrapErr()).toBe('x');
  });

  it('passes the same input to every plugin it consults', () => {
    const first: Plugin<string, number> = { run: vi.fn((input: string) => err(input)) };
    const second = createHit(3);

    createRunner([first, second])('input');

    expect(first.run).toHaveBeenCalledWith('input');
    expect(second.run).toHaveBeenCalledWith('input');
  });
});

describe('when', () => {
  it('matches with the derived value when the predicate holds', () => {
    const plugin = when(
      (input: string) => input === 'x',
      (input) => input.length,
    );

    expect(plugin.run('x')._unsafeUnwrap()).toBe(1);
  });

  it('returns err with the same input when the predicate fails', () => {
    const input = { path: '/y' };
    const plugin = when(
      () => false,
      () => 1,
    );

    expect(plugin.run(input)._unsafeUnwrapErr()).toBe(input);
  });

  it('does not derive a value on a miss', () => {
    const toValue = vi.fn(() => 1);

    when(() => false, toValue).run('x');

    expect(toValue).not.toHaveBeenCalled();
  });
});
