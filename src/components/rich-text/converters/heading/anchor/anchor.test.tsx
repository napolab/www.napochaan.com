import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { MotionContext } from '@hooks/use-prefers-reduced-motion';

import { HeadingAnchor } from './index';

const motion = (reduced: boolean) => ({ reduced, toggle: () => {} });

describe('HeadingAnchor', () => {
  beforeEach(() => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    vi.spyOn(history, 'replaceState').mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('labels the copy button for the heading', async () => {
    await render(<HeadingAnchor slug="intro" />);
    await expect.element(page.getByRole('button', { name: 'この見出しへのリンクをコピー' })).toBeInTheDocument();
  });

  it('reflects the heading fragment in the address bar on press', async () => {
    await render(<HeadingAnchor slug="intro" />);
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(history.replaceState).toHaveBeenCalled();
    expect(vi.mocked(history.replaceState).mock.calls[0]?.[2]).toMatch(/#intro$/);
  });

  it('smooth-scrolls the enclosing heading into view on press', async () => {
    await render(
      <MotionContext.Provider value={motion(false)}>
        <h2 id="intro">
          <HeadingAnchor slug="intro" />
          見出し
        </h2>
      </MotionContext.Provider>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('jumps without smooth scroll when reduced motion is preferred', async () => {
    await render(
      <MotionContext.Provider value={motion(true)}>
        <h2 id="intro">
          <HeadingAnchor slug="intro" />
          見出し
        </h2>
      </MotionContext.Provider>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
  });
});
