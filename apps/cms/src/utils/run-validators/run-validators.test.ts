import { err, ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';

import { createValidator, runValidators } from '.';

import type { Validator } from '.';

const evenLength: Validator<string, string> = {
  run: (value) => (value.length % 2 === 0 ? ok(value) : err('odd length')),
};

const noSpace: Validator<string, string> = {
  run: (value) => (value.includes(' ') ? err('has space') : ok(value)),
};

describe('runValidators', () => {
  it('全 validator を通れば ok(input) を返す', () => {
    const result = runValidators('abcd', [evenLength, noSpace]);

    expect(result.isOk() ? result.value : null).toBe('abcd');
  });

  it('最初に失敗した validator の err で短絡し、後段は評価しない', () => {
    const later = vi.fn<Validator<string, string>['run']>(() => ok('x'));
    // 'abc' は evenLength で失敗する。
    const result = runValidators('abc', [evenLength, { run: later }]);

    expect(result.isErr() ? result.error : null).toBe('odd length');
    expect(later).not.toHaveBeenCalled();
  });

  it('後段の validator の err も拾う', () => {
    // 'a bc' は evenLength を通り(長さ4)、noSpace で失敗する。
    const result = runValidators('a bc', [evenLength, noSpace]);

    expect(result.isErr() ? result.error : null).toBe('has space');
  });

  it('validators が空なら ok(input) を返す', () => {
    const result = runValidators('x', []);

    expect(result.isOk() ? result.value : null).toBe('x');
  });
});

describe('createValidator', () => {
  it('validators を固定した具体 validator 関数を返す', () => {
    const validate = createValidator([evenLength, noSpace]);

    expect(validate('abcd').isOk()).toBe(true);
    expect(validate('a bc').isErr()).toBe(true);
  });
});
