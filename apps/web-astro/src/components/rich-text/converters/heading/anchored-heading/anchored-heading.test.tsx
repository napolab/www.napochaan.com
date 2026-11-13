import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { MotionContext } from '@hooks/use-prefers-reduced-motion';

import { AnchoredHeading } from './index';

const motion = (reduced: boolean) => ({ reduced, toggle: () => {} });

describe('AnchoredHeading', () => {
  beforeEach(() => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    vi.spyOn(history, 'replaceState').mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the heading with its slug id and text', async () => {
    await render(
      <AnchoredHeading level={2} slug="intro">
        はじめに
      </AnchoredHeading>,
    );
    const heading = page.getByRole('heading', { level: 2, name: /はじめに/ });
    await expect.element(heading).toBeInTheDocument();
    expect(heading.element().id).toBe('intro');
  });

  it('exposes the heading copy button', async () => {
    await render(
      <AnchoredHeading level={2} slug="intro">
        はじめに
      </AnchoredHeading>,
    );
    await expect.element(page.getByRole('button', { name: 'この見出しへのリンクをコピー' })).toBeInTheDocument();
  });

  it('omits the copy button when the heading has no slug', async () => {
    await render(
      <AnchoredHeading level={2} slug="">
        はじめに
      </AnchoredHeading>,
    );
    expect(page.getByRole('button').elements()).toHaveLength(0);
  });

  it('reflects the heading fragment in the address bar on press', async () => {
    await render(
      <AnchoredHeading level={2} slug="intro">
        はじめに
      </AnchoredHeading>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(vi.mocked(history.replaceState).mock.calls[0]?.[2]).toMatch(/#intro$/);
  });

  it('smooth-scrolls its own heading into view on press', async () => {
    await render(
      <MotionContext.Provider value={motion(false)}>
        <AnchoredHeading level={2} slug="intro">
          はじめに
        </AnchoredHeading>
      </MotionContext.Provider>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('jumps without smooth scroll when reduced motion is preferred', async () => {
    await render(
      <MotionContext.Provider value={motion(true)}>
        <AnchoredHeading level={2} slug="intro">
          はじめに
        </AnchoredHeading>
      </MotionContext.Provider>,
    );
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
  });
});
