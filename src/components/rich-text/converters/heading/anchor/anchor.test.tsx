import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { HeadingAnchor } from './index';

describe('HeadingAnchor', () => {
  it('exposes a labelled copy button', async () => {
    await render(<HeadingAnchor slug="intro" />);
    await expect.element(page.getByRole('button', { name: 'この見出しへのリンクをコピー' })).toBeInTheDocument();
  });

  it('copies the current page URL with the heading fragment on press', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<HeadingAnchor slug="intro" />);
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0]?.[0];
    expect(copied).toMatch(/#intro$/);
  });

  it('marks itself copied after a successful press', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<HeadingAnchor slug="intro" />);
    const button = page.getByRole('button', { name: 'この見出しへのリンクをコピー' });
    await button.click();

    await expect.element(button).toHaveAttribute('data-copied', 'true');
  });

  it('does not mark itself copied when the clipboard write fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    await render(<HeadingAnchor slug="intro" />);
    const button = page.getByRole('button', { name: 'この見出しへのリンクをコピー' });
    await button.click();

    await expect.element(button).not.toHaveAttribute('data-copied');
  });
});
