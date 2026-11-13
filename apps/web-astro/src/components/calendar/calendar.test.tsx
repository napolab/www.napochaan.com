import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Calendar } from './index';

import type { CalendarMark } from './index';

const marks: CalendarMark[] = [
  { date: '2026-01-10', tone: 'default' },
  { date: '2026-01-15', tone: 'accent' },
];

// min/max を 1 月に固定すると、実行日がいつでも focusedValue が 2026-01 にクランプされ
// 表示月が決定的になる（ついでに両方向の月送り無効も検証できる）。
const singleMonth = { minDate: '2026-01-01', maxDate: '2026-01-31' };

describe('Calendar', () => {
  it('label の aria-label でカレンダーが描画される', async () => {
    render(<Calendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await expect.element(page.getByRole('heading')).toBeInTheDocument();
    await expect.poll(() => document.querySelector('[aria-label^="活動カレンダー"]')).not.toBeNull();
  });

  it('marks の日に data-tone が付く（default / accent の描き分け）', async () => {
    render(<Calendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await expect.poll(() => document.querySelectorAll('[data-tone="default"]').length).toBe(1);
    await expect.poll(() => document.querySelectorAll('[data-tone="accent"]').length).toBe(1);
  });

  it('tone 省略時は default になる', async () => {
    const marksWithoutTone: CalendarMark[] = [{ date: '2026-01-20' }];
    render(<Calendar marks={marksWithoutTone} {...singleMonth} label="活動カレンダー" />);
    await expect.poll(() => document.querySelectorAll('[data-tone="default"]').length).toBe(1);
  });

  it('marks を渡さないときはドットなしの素のカレンダーになる', async () => {
    render(<Calendar {...singleMonth} label="活動カレンダー" />);
    await expect.element(page.getByRole('heading')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-tone]').length).toBe(0);
  });

  it('minDate / maxDate の月では月送りボタンが無効になる', async () => {
    render(<Calendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await expect.element(page.getByRole('button', { name: '前の月' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: '次の月' })).toBeDisabled();
  });

  it('min/max が無いときは月送りできる', async () => {
    render(<Calendar marks={marks} label="活動カレンダー" />);
    await expect.element(page.getByRole('button', { name: '前の月' })).not.toBeDisabled();
  });
});
