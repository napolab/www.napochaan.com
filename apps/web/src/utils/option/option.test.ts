import { describe, expect, it, vi } from 'vitest';

import { matchOption, none, some } from '.';

describe('some / none', () => {
  it('some は値を保持する', () => {
    expect(some(42)).toEqual({ some: true, value: 42 });
  });

  it('none は不在を表す', () => {
    expect(none).toEqual({ some: false });
  });
});

describe('matchOption', () => {
  it('some のとき some ハンドラに値を渡す', () => {
    const onNone = vi.fn(() => 'none');
    const result = matchOption(some(3), { some: (value) => `some:${value}`, none: onNone });

    expect(result).toBe('some:3');
    expect(onNone).not.toHaveBeenCalled();
  });

  it('none のとき none ハンドラを呼ぶ(some は評価しない)', () => {
    const onSome = vi.fn((value: number) => `some:${value}`);
    const result = matchOption<number, string>(none, { some: onSome, none: () => 'fallback' });

    expect(result).toBe('fallback');
    expect(onSome).not.toHaveBeenCalled();
  });
});
