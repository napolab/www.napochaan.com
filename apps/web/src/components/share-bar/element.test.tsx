import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { SHARE_BAR_TAG, defineShareBarElement } from './element';
import { COPIED_LABEL } from './labels';
import { ShareBar } from './index';

const URL_ = 'https://www.napochaan.com/works/1';
const TITLE = 'タイトル';

// share-bar.astro: the React ShareBar's static markup inside the element.
const mount = () => {
  const container = document.createElement('div');
  container.innerHTML = `<${SHARE_BAR_TAG} share-url="${URL_}" share-title="${TITLE}">${renderToStaticMarkup(<ShareBar url={URL_} title={TITLE} />)}</${SHARE_BAR_TAG}>`;
  document.body.appendChild(container);
};

// Own `share` property shadows any native navigator.share; `undefined` = unsupported.
const setShare = (impl: ((data: ShareData) => Promise<void>) | undefined): void => {
  Object.defineProperty(navigator, 'share', { value: impl, configurable: true, writable: true });
};

describe('<share-bar>', () => {
  beforeEach(() => {
    defineShareBarElement();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setShare(undefined);
    document.body.replaceChildren();
  });

  it('keeps the labelled share group and the X intent link (static markup)', async () => {
    mount();
    await expect.element(page.getByRole('group', { name: 'この記事を共有' })).toBeInTheDocument();
    const link = page.getByRole('link', { name: /twitter\(x\)/i });
    expect(link.element().getAttribute('href')).toMatch(/twitter\.com\/intent\/tweet/);
    await expect.element(link).toHaveAttribute('target', '_blank');
  });

  it('shares the canonical url through the Web Share API on press', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    mount();

    await page.getByRole('button', { name: 'share' }).click();

    await vi.waitFor(() => expect(share).toHaveBeenCalledWith({ title: TITLE, url: URL_ }));
    expect(writeText).not.toHaveBeenCalled();
    await expect.element(page.getByRole('button', { name: 'share' })).toBeInTheDocument();
  });

  it('falls back to copying the url, announces "copied ✓" as the button name, then reverts', async () => {
    setShare(undefined);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    mount();

    await page.getByRole('button', { name: 'share' }).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(URL_));
    await expect.element(page.getByRole('button', { name: COPIED_LABEL })).toBeInTheDocument();
    // The share icon stays in place; only the label text changed.
    expect(page.getByRole('button', { name: COPIED_LABEL }).element().querySelector('svg')).not.toBeNull();
    await expect.element(page.getByRole('button', { name: 'share' }), { timeout: 4000 }).toBeInTheDocument();
  });

  it('presses from the keyboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    mount();
    page.getByRole('button', { name: 'share' }).element().focus();
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(share).toHaveBeenCalledTimes(1));
  });
});
