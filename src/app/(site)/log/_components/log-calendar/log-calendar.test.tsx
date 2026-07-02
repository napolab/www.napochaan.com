import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LogCalendar } from './index';

import type { CalendarMark } from '@components/calendar';

const marks: CalendarMark[] = [
  { date: '2026-01-10', tone: 'default' },
  { date: '2026-01-15', tone: 'accent' },
];

// min/max を 1 月に固定すると、実行日がいつでも表示月が 2026-01 にクランプされ決定的になる。
const singleMonth = { minDate: '2026-01-01', maxDate: '2026-01-31' };

describe('LogCalendar', () => {
  it('トリガーをクリックするとカレンダーの dialog が開く', async () => {
    render(<LogCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('marks の日付セルに data-tone が付く（default / accent の描き分け）', async () => {
    render(<LogCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
    await expect.poll(() => document.querySelectorAll('[data-tone="default"]').length).toBe(1);
    await expect.poll(() => document.querySelectorAll('[data-tone="accent"]').length).toBe(1);
  });
});
