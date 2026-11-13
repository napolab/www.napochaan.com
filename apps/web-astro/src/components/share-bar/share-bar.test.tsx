import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { ShareBar } from './index';

// Own `share` property shadows any native `navigator.share` (present on macOS
// Chrome). `undefined` simulates an unsupported environment.
const setShare = (impl: ((data: ShareData) => Promise<void>) | undefined): void => {
  Object.defineProperty(navigator, 'share', { value: impl, configurable: true, writable: true });
};

afterEach(() => {
  vi.restoreAllMocks();
  setShare(undefined);
});

describe('ShareBar', () => {
  it('exposes a Twitter(X) share link with the tweet intent href', async () => {
    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    const link = page.getByRole('link', { name: /twitter\(x\)/i });
    const element = link.element();
    expect(element.getAttribute('href')).toMatch(/twitter\.com\/intent\/tweet/);
    await expect.element(link).toHaveAttribute('target', '_blank');
  });

  it('shares the canonical url through the Web Share API on press', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    await page.getByRole('button', { name: /share/i }).click();

    await vi.waitFor(() => expect(share).toHaveBeenCalledWith({ title: 'タイトル', url: 'https://www.napochaan.com/works/1' }));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to copying the url and swaps the label when the Web Share API is unavailable', async () => {
    setShare(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    await page.getByRole('button', { name: /share/i }).click();

    expect(writeText).toHaveBeenCalledWith('https://www.napochaan.com/works/1');
    await expect.element(page.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });
});
