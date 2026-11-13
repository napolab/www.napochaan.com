import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { COPY_HASH_BUTTON_TAG, defineCopyHashButtonElement } from './element';

const LABEL = 'この見出しへのリンクをコピー';

// The markup copy-hash-button.astro renders, inside a server-rendered heading.
const mount = (anchored = true) => {
  const container = document.createElement('div');
  container.innerHTML = `<h2 id="intro" data-testid="heading"><${COPY_HASH_BUTTON_TAG} slug="intro"${anchored ? ' anchored' : ''}><button type="button" aria-label="${LABEL}"></button></${COPY_HASH_BUTTON_TAG}>intro</h2>`;
  document.body.appendChild(container);
  return page.getByRole('button', { name: LABEL });
};

describe('<copy-hash-button>', () => {
  beforeEach(() => {
    defineCopyHashButtonElement();
    history.replaceState(null, '', location.pathname);
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    write(MOTION_STORAGE_KEY, null);
    history.replaceState(null, '', location.pathname);
    document.body.replaceChildren();
  });

  it('copies the current page URL with the fragment on press', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await mount().click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toMatch(/#intro$/);
  });

  it('flashes data-copied after a successful copy, then resets it', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const button = mount();
    await button.click();

    await expect.element(button).toHaveAttribute('data-copied', 'true');
    await expect.element(button, { timeout: 3000 }).not.toHaveAttribute('data-copied');
  });

  it('does not mark itself copied when the clipboard write fails, but still jumps', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const button = mount();
    await button.click();

    await expect.poll(() => location.hash).toBe('#intro');
    await expect.element(button).not.toHaveAttribute('data-copied');
  });

  it('smooth-scrolls its enclosing heading into view and writes the fragment when anchored', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await mount().click();

    await expect.poll(() => location.hash).toBe('#intro');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(vi.mocked(HTMLElement.prototype.scrollIntoView).mock.contexts[0]).toBe(document.querySelector('[data-testid="heading"]'));
  });

  it('jumps without smooth scroll under reduced motion', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    write(MOTION_STORAGE_KEY, false);
    await mount().click();

    await expect.poll(() => location.hash).toBe('#intro');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
  });

  it('only copies (no jump) when not anchored', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await mount(false).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(location.hash).toBe('');
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('presses from the keyboard', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    mount().element().focus();
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  });

  it('sets data-hovered for a mouse hover but not for touch, like react-aria', async () => {
    const button = mount();
    const element = button.element();
    element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    expect(element.hasAttribute('data-hovered')).toBe(false);

    element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    expect(element.getAttribute('data-hovered')).toBe('true');
    element.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    expect(element.hasAttribute('data-hovered')).toBe(false);
  });
});
