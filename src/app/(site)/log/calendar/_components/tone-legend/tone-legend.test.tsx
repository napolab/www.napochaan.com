import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ToneLegend } from './index';

describe('ToneLegend', () => {
  it('記録 / 予定 の 2 トークンを説明リストとして描画する', async () => {
    render(<ToneLegend />);
    await expect.element(page.getByText('記録')).toBeInTheDocument();
    await expect.element(page.getByText('予定')).toBeInTheDocument();
  });

  it('見本のドットは data-tone で描き分けられ、読み上げからは外れる', async () => {
    render(<ToneLegend />);
    await expect.poll(() => document.querySelectorAll('[data-tone="default"][aria-hidden="true"]').length).toBe(1);
    await expect.poll(() => document.querySelectorAll('[data-tone="accent"][aria-hidden="true"]').length).toBe(1);
  });
});
