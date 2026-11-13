import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { TYPEWRITER_TEXT_TAG, defineTypewriterTextElement } from './element';

// The markup typewriter-text.astro renders: srOnly, then the aria-hidden typeWrap
// holding the sizer and the typed overlay (whose only child at rest is the caret).
const markup = (text: string, sizer = text, phrase = false) =>
  `<${TYPEWRITER_TEXT_TAG}${phrase ? ' phrase' : ''}><span>${text}</span><span aria-hidden="true"><span>${sizer}</span><span><span data-caret></span></span></span></${TYPEWRITER_TEXT_TAG}>`;

const mount = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

const typedOf = (container: HTMLElement) => {
  const typed = container.querySelector(`${TYPEWRITER_TEXT_TAG} > span:nth-child(2) > span:nth-child(2)`);
  if (!(typed instanceof HTMLElement)) throw new Error('typed overlay not rendered');
  return typed;
};

const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('<typewriter-text>', () => {
  beforeEach(() => {
    defineTypewriterTextElement();
    write(MOTION_STORAGE_KEY, null);
  });

  afterEach(() => {
    write(MOTION_STORAGE_KEY, null);
    document.body.replaceChildren();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineTypewriterTextElement()).not.toThrow();
    expect(customElements.get(TYPEWRITER_TEXT_TAG)).toBeDefined();
  });

  it('types the text into the overlay, in front of the caret', async () => {
    const container = mount(markup('napochaan'));
    const typed = typedOf(container);

    await expect.poll(() => typed.textContent, { timeout: 5000 }).toBe('napochaan');
    expect(typed.lastElementChild?.hasAttribute('data-caret')).toBe(true);
  });

  it('jumps straight to the full text under reduced motion', async () => {
    write(MOTION_STORAGE_KEY, false);
    const container = mount(markup('napochaan'));

    expect(typedOf(container).textContent).toBe('napochaan');
  });

  it('finishes the reveal when reduced motion is turned on mid-typing', async () => {
    const container = mount(markup('さまざまな「破壊」、承っております。'));
    await flush(100);
    write(MOTION_STORAGE_KEY, false);

    expect(typedOf(container).textContent).toBe('さまざまな「破壊」、承っております。');
  });

  it('swaps in the phrased sizer copy (with its <wbr>) once done when phrase is set', async () => {
    write(MOTION_STORAGE_KEY, false);
    const container = mount(markup('今日は天気です。', '<span class="phrased">今日は<wbr>天気です。</span>', true));
    const typed = typedOf(container);

    expect(typed.querySelector('.phrased wbr')).not.toBeNull();
    expect(typed.textContent).toBe('今日は天気です。');
    expect(typed.lastElementChild?.hasAttribute('data-caret')).toBe(true);
  });

  it('stops typing while disconnected and resumes where it left off on reconnect', async () => {
    const container = mount(markup('napochaan napochaan'));
    const element = container.querySelector(TYPEWRITER_TEXT_TAG);
    if (element === null) throw new Error('not rendered');
    const typed = typedOf(container);
    await expect.poll(() => (typed.textContent ?? '').length).toBeGreaterThan(2);

    element.remove();
    const frozen = typed.textContent;
    await flush(400);
    expect(typed.textContent).toBe(frozen);

    container.appendChild(element);
    await expect.poll(() => typed.textContent, { timeout: 5000 }).toBe('napochaan napochaan');
  });
});
