import { describe, expect, it } from 'vitest';

import { LOG_META_OPTIONS } from '.';

// この 8 個の値は年表の表示ラベルそのものであり、既存の DB 行とバイト一致していないと
// 壊れる。型(`Log['meta']`)は payload-types.ts の再生成で一緒に変わってしまうため、
// 「うっかり表記を変えた」を型では検出できない。ここで値そのものに釘を刺す。
describe('LOG_META_OPTIONS', () => {
  it('既存の DB 行と一致する 8 個の値を保つ', () => {
    expect([...LOG_META_OPTIONS]).toEqual(['DJ', 'VJ', 'DJ/VJ', 'Support', 'Dev', 'Flyer', 'Talk', 'Video']);
  });

  it('重複を含まない', () => {
    expect(new Set(LOG_META_OPTIONS).size).toBe(LOG_META_OPTIONS.length);
  });
});
