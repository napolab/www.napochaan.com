import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ActivityCalendar } from './index';

import type { ActivityCalendarMark } from './index';

const marks: ActivityCalendarMark[] = [
  { date: '2026-01-10', upcoming: false },
  { date: '2026-01-15', upcoming: true },
];

// min/max を 1 月に固定すると、実行日がいつでも focusedValue が 2026-01 にクランプされ
// 表示月が決定的になる（ついでに両方向の月送り無効も検証できる）。
const singleMonth = { minDate: '2026-01-01', maxDate: '2026-01-31' };

describe('ActivityCalendar', () => {
  it('トリガーをクリックするとカレンダーの dialog が開く', async () => {
    render(<ActivityCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('marks の日付セルに data-mark が付く（past / upcoming の描き分け）', async () => {
    render(<ActivityCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
    await expect.poll(() => document.querySelectorAll('[data-mark="past"]').length).toBe(1);
    await expect.poll(() => document.querySelectorAll('[data-mark="upcoming"]').length).toBe(1);
  });

  it('minDate / maxDate の月では月送りボタンが無効になる', async () => {
    render(<ActivityCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('button', { name: '前の月' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: '次の月' })).toBeDisabled();
  });

  it('min/max が無いときは月送りできる', async () => {
    render(<ActivityCalendar marks={marks} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('button', { name: '前の月' })).not.toBeDisabled();
  });
});
