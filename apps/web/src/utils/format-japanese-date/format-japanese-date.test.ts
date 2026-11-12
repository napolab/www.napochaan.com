import { describe, expect, it } from 'vitest';

import { formatJapaneseDate } from '.';

describe('formatJapaneseDate', () => {
  it('ISO 日付を日本語表記にする', () => {
    expect(formatJapaneseDate('2026-08-01')).toBe('2026年8月1日');
  });

  it('月日をゼロ埋めしない', () => {
    expect(formatJapaneseDate('2026-11-10')).toBe('2026年11月10日');
  });

  it('タイムスタンプ付きでも Asia/Tokyo の暦日で解釈する', () => {
    // UTC 2026-07-31T15:00:00Z = JST 2026-08-01T00:00:00+09:00
    expect(formatJapaneseDate('2026-07-31T15:00:00.000Z')).toBe('2026年8月1日');
  });
});
