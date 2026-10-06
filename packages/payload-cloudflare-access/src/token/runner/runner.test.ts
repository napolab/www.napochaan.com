import { err, ok } from 'neverthrow';
import { describe, expect, test, vi } from 'vitest';

import { createTokenRunner } from './index';

import type { AccessToken, TokenSource } from '../types';

const miss: TokenSource = { run: (headers) => err(headers) };

const createHit = (token: AccessToken): TokenSource => ({ run: vi.fn(() => ok(token)) });

describe('createTokenRunner', () => {
  test('returns the first ok', () => {
    const hitA = createHit({ token: 'a', source: 'header' });
    const hitB = createHit({ token: 'b', source: 'cookie' });
    const headers = new Headers();

    const result = createTokenRunner([miss, hitA, hitB])(headers);

    expect(result._unsafeUnwrap()).toEqual({ token: 'a', source: 'header' });
    expect(hitB.run).not.toHaveBeenCalled();
  });

  test('returns err with the input when nothing matches', () => {
    const headers = new Headers();

    const result = createTokenRunner([miss, miss])(headers);

    expect(result._unsafeUnwrapErr()).toBe(headers);
  });

  test('returns err for an empty list', () => {
    const headers = new Headers();

    const result = createTokenRunner([])(headers);

    expect(result._unsafeUnwrapErr()).toBe(headers);
  });
});
