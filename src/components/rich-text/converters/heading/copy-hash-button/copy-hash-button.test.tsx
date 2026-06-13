import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { CopyHashButton } from './index';

describe('CopyHashButton', () => {
  it('exposes a copy button with the given label', async () => {
    await render(<CopyHashButton slug="intro" label="リンクをコピー" />);
    await expect.element(page.getByRole('button', { name: 'リンクをコピー' })).toBeInTheDocument();
  });

  it('copies the current page URL with the fragment on press', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<CopyHashButton slug="intro" label="リンクをコピー" />);
    await page.getByRole('button', { name: 'リンクをコピー' }).click();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toMatch(/#intro$/);
  });

  it('marks itself copied after a successful press', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<CopyHashButton slug="intro" label="リンクをコピー" />);
    const button = page.getByRole('button', { name: 'リンクをコピー' });
    await button.click();

    await expect.element(button).toHaveAttribute('data-copied', 'true');
  });

  it('does not mark itself copied when the clipboard write fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    await render(<CopyHashButton slug="intro" label="リンクをコピー" />);
    const button = page.getByRole('button', { name: 'リンクをコピー' });
    await button.click();

    await expect.element(button).not.toHaveAttribute('data-copied');
  });

  it('runs the caller onPress after copying', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const onPress = vi.fn();

    await render(<CopyHashButton slug="intro" label="リンクをコピー" onPress={onPress} />);
    await page.getByRole('button', { name: 'リンクをコピー' }).click();

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
