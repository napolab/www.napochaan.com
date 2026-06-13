import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { QuoteShare } from './index';

// Force a fine pointer so the interactive layer mounts deterministically.
const stubFinePointer = (): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(pointer: fine)',
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
};

// Select the whole paragraph and finish the gesture with a pointerup.
const selectParagraph = (el: Element): void => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('QuoteShare', () => {
  it('opens a share toolbar above a text selection and copies a text-fragment url', async () => {
    stubFinePointer();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(
      <QuoteShare url="https://www.napochaan.com/blog/1">
        <p>引用したい本文のテキスト</p>
      </QuoteShare>,
    );

    selectParagraph(page.getByText('引用したい本文のテキスト').element());

    const copy = page.getByRole('button', { name: '引用リンク' });
    await expect.element(copy).toBeInTheDocument();
    await copy.click();

    expect(writeText).toHaveBeenCalledWith('https://www.napochaan.com/blog/1#:~:text=%E5%BC%95%E7%94%A8%E3%81%97%E3%81%9F%E3%81%84%E6%9C%AC%E6%96%87%E3%81%AE%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88');
    await expect.element(page.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
  });

  it('does not open when the selection escapes the body container', async () => {
    stubFinePointer();
    await render(
      <div>
        <QuoteShare url="https://www.napochaan.com/blog/1">
          <p>本文の内側のテキスト</p>
        </QuoteShare>
        <p>本文の外側のテキスト</p>
      </div>,
    );

    const inside = page.getByText('本文の内側のテキスト').element();
    const outside = page.getByText('本文の外側のテキスト').element();
    const insideText = inside.firstChild;
    const outsideText = outside.firstChild;

    if (insideText === null || outsideText === null) {
      throw new Error('Test setup failed: could not find text nodes');
    }

    // Spy on getSelection to simulate a selection anchored inside the body but
    // focused outside it — the exact cross-boundary case the guard must reject.
    // We fabricate this because Chromium may collapse a programmatically-set
    // cross-boundary range, making it impossible to exercise this path via DOM APIs.
    const fakeRect = new DOMRect(0, 0, 100, 20);
    const fakeRange = { getBoundingClientRect: () => fakeRect };
    const fakeSelection = {
      isCollapsed: false,
      toString: () => '本文の内側のテキスト',
      anchorNode: insideText,
      focusNode: outsideText,
      getRangeAt: () => fakeRange,
    };
    const spy = vi.spyOn(window, 'getSelection').mockReturnValue(fakeSelection as unknown as Selection);

    inside.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

    // Restore before assertion so other checks aren't affected.
    spy.mockRestore();

    // No toolbar action should appear — focus is outside the container.
    // Use `await expect.element(...).not.toBeInTheDocument()` to wait for any
    // async React re-render and then assert absence.
    await expect.element(page.getByRole('button', { name: '引用リンク' })).not.toBeInTheDocument();
  });

  it('exposes an X quote link whose href carries the text-fragment url', async () => {
    stubFinePointer();
    await render(
      <QuoteShare url="https://www.napochaan.com/blog/1">
        <p>引用したい本文のテキスト</p>
      </QuoteShare>,
    );

    selectParagraph(page.getByText('引用したい本文のテキスト').element());

    const link = page.getByRole('link', { name: /x/i });
    await expect.element(link).toBeInTheDocument();
    const href = link.element().getAttribute('href') ?? '';
    expect(href).toContain('twitter.com/intent/tweet');
    expect(href).toContain(encodeURIComponent('https://www.napochaan.com/blog/1#:~:text='));
  });
});
