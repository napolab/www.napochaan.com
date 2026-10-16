import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LogCalendarLink } from './index';

describe('LogCalendarLink', () => {
  it('カレンダー単体ページへのリンクを描画する', async () => {
    render(<LogCalendarLink label="活動カレンダー" />);
    await expect.element(page.getByRole('link', { name: '活動カレンダーを開く' })).toHaveAttribute('href', '/log/calendar');
  });
});
