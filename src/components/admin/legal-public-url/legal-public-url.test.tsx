import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LegalPublicURLView } from './view';

describe('LegalPublicURLView', () => {
  it('slug があれば {origin}/legal/{slug} をリンクで表示する', async () => {
    await render(<LegalPublicURLView slug="terms" origin="https://napochaan.com" />);

    const link = page.getByRole('link', { name: 'https://napochaan.com/legal/terms' });
    await expect.element(link).toHaveAttribute('href', 'https://napochaan.com/legal/terms');
  });

  it('別オリジンでもそのまま反映する(現環境の base を使う想定)', async () => {
    await render(<LegalPublicURLView slug="disclaimer" origin="https://stg.napochaan.com" />);

    await expect.element(page.getByRole('link', { name: 'https://stg.napochaan.com/legal/disclaimer' })).toBeInTheDocument();
  });

  it('slug が空ならリンクを出さずプレースホルダ文言を表示する', async () => {
    await render(<LegalPublicURLView slug="" origin="https://napochaan.com" />);

    await expect.element(page.getByText('slug を入力すると公開 URL が表示されます')).toBeInTheDocument();
    await expect.element(page.getByRole('link')).not.toBeInTheDocument();
  });
});
