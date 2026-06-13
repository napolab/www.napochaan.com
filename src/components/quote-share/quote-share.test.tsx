import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { QuoteShare } from './index';

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

const selectParagraph = (el: Element): void => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
};

const EXPECTED_BLOCK = '> 引用したい本文のテキスト\nサンプルタイトル | https://www.napochaan.com/blog/1';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('QuoteShare', () => {
  it('copies the quote block on the copy action', async () => {
    stubFinePointer();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(
      <QuoteShare url="https://www.napochaan.com/blog/1" title="サンプルタイトル">
        <p>引用したい本文のテキスト</p>
      </QuoteShare>,
    );

    selectParagraph(page.getByText('引用したい本文のテキスト').element());

    const copy = page.getByRole('button', { name: '引用をコピー' });
    await expect.element(copy).toBeInTheDocument();
    await copy.click();

    expect(writeText).toHaveBeenCalledWith(EXPECTED_BLOCK);
    await expect.element(page.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
  });

  it('exposes an X quote link carrying the quote block as the tweet text', async () => {
    stubFinePointer();
    await render(
      <QuoteShare url="https://www.napochaan.com/blog/1" title="サンプルタイトル">
        <p>引用したい本文のテキスト</p>
      </QuoteShare>,
    );

    selectParagraph(page.getByText('引用したい本文のテキスト').element());

    const link = page.getByRole('link', { name: /x/i });
    await expect.element(link).toBeInTheDocument();
    const href = link.element().getAttribute('href') ?? '';
    expect(href.startsWith('https://twitter.com/intent/tweet?text=')).toBe(true);
    expect(href.includes('&url=')).toBe(false);
    expect(new URL(href).searchParams.get('text')).toBe(EXPECTED_BLOCK);
  });

  it('does not open when the selection escapes the body container', async () => {
    stubFinePointer();
    await render(
      <div>
        <QuoteShare url="https://www.napochaan.com/blog/1" title="サンプルタイトル">
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

    const fakeRange = { getBoundingClientRect: () => new DOMRect(0, 0, 100, 20) };
    const fakeSelection = {
      isCollapsed: false,
      toString: () => '本文の内側のテキスト',
      anchorNode: insideText,
      focusNode: outsideText,
      getRangeAt: () => fakeRange,
    };
    const spy = vi.spyOn(window, 'getSelection').mockReturnValue(fakeSelection as unknown as Selection);

    inside.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    spy.mockRestore();

    await expect.element(page.getByRole('button', { name: '引用をコピー' })).not.toBeInTheDocument();
  });
});
