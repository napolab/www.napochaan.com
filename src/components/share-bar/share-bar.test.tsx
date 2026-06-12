import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { ShareBar } from './index';

describe('ShareBar', () => {
  it('exposes an X share link with the tweet intent href', async () => {
    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    const link = page.getByRole('link', { name: /x/i });
    const element = link.element();
    expect(element.getAttribute('href')).toMatch(/twitter\.com\/intent\/tweet/);
    await expect.element(link).toHaveAttribute('target', '_blank');
  });

  it('copies the url and swaps the label to COPIED on press', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    const copy = page.getByRole('button', { name: /copy/i });
    await copy.click();

    expect(writeText).toHaveBeenCalledWith('https://www.napochaan.com/works/1');
    await expect.element(page.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });
});
