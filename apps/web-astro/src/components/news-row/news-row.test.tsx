import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { NewsRow } from './index';

describe('NewsRow', () => {
  it('renders the date, category and title', async () => {
    render(
      <ol>
        <NewsRow date="06.14" category="event" title="サイトを公開しました" />
      </ol>,
    );
    await expect.element(page.getByText('06.14')).toBeInTheDocument();
    await expect.element(page.getByText('event')).toBeInTheDocument();
    await expect.element(page.getByText('サイトを公開しました')).toBeInTheDocument();
  });

  it('renders the title as plain text when no href is given', async () => {
    render(
      <ol>
        <NewsRow date="06.14" category="info" title="plain title" />
      </ol>,
    );
    expect(page.getByRole('link').elements()).toHaveLength(0);
  });

  it('links an internal href without opening a new tab', async () => {
    render(
      <ol>
        <NewsRow date="06.14" category="event" title="内部リンク" href="/news/1" />
      </ol>,
    );
    const link = page.getByRole('link', { name: '内部リンク' });
    await expect.element(link).toHaveAttribute('href', '/news/1');
    await expect.element(link).not.toHaveAttribute('target');
  });

  it('opens an external href in a new tab with a safe rel', async () => {
    render(
      <ol>
        <NewsRow date="06.14" category="release" title="外部リンク" href="https://example.com" />
      </ol>,
    );
    const link = page.getByRole('link', { name: '外部リンク' });
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
