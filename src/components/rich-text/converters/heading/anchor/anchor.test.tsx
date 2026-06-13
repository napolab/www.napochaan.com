import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { MotionContext } from '@hooks/use-prefers-reduced-motion';

import { HeadingAnchor } from './index';

const motion = (reduced: boolean) => ({ reduced, toggle: () => {} });

describe('HeadingAnchor', () => {
  beforeEach(() => {
    vi.spyOn(history, 'replaceState').mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(writeText.mock.calls[0]?.[0]).toMatch(/#intro$/);
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

  it('reflects the heading fragment in the address bar on press', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<HeadingAnchor slug="intro" />);
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(history.replaceState).toHaveBeenCalled();
    expect(vi.mocked(history.replaceState).mock.calls[0]?.[2]).toMatch(/#intro$/);
  });

  it('smooth-scrolls the matching heading into view on press', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(
      <MotionContext.Provider value={motion(false)}>
        <h2 id="intro">見出し</h2>
        <HeadingAnchor slug="intro" />
      </MotionContext.Provider>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('jumps without smooth scroll when reduced motion is preferred', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(
      <MotionContext.Provider value={motion(true)}>
        <h2 id="intro">見出し</h2>
        <HeadingAnchor slug="intro" />
      </MotionContext.Provider>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
  });
});
