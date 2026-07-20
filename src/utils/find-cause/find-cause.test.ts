import { describe, expect, it } from 'vitest';

import { findCause } from '.';

class AError extends Error {
  override name = 'AError' as const;
}
class BError extends Error {
  override name = 'BError' as const;
}

const isAError = (value: unknown): value is AError => value instanceof AError;

describe('findCause', () => {
  it('先頭の値が述語にマッチすれば some で返す', () => {
    const error = new AError('top');

    expect(findCause(error, isAError)).toEqual({ some: true, value: error });
  });

  it('1 段下の cause がマッチすれば some で返す', () => {
    const cause = new AError('inner');
    const error = new BError('outer', { cause });

    expect(findCause(error, isAError)).toEqual({ some: true, value: cause });
  });

  it('複数段辿ってマッチを some で返す', () => {
    const deep = new AError('deep');
    const mid = new BError('mid', { cause: deep });
    const error = new BError('outer', { cause: mid });

    expect(findCause(error, isAError)).toEqual({ some: true, value: deep });
  });

  it('チェーンにマッチが無ければ none', () => {
    const error = new BError('outer', { cause: new BError('inner') });

    expect(findCause(error, isAError)).toEqual({ some: false });
  });

  it('Error でない値は cause を辿れず none(述語が直接マッチする場合を除く)', () => {
    expect(findCause('just a string', isAError)).toEqual({ some: false });
    expect(findCause(undefined, isAError)).toEqual({ some: false });
  });

  it('cause が Error でない値で途切れても停止する', () => {
    const error = new BError('outer', { cause: 'string cause' });

    expect(findCause(error, isAError)).toEqual({ some: false });
  });
});
