import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import { jumpToHeading } from '../jump-to-heading';
import { COPIED_RESET_MS, copyHashLink, enclosingHeading } from './copy-hash';

// `<copy-hash-button slug="…" anchored>` — the framework-free driver of
// ./copy-hash-button.astro (no React island). Client-only: imported solely from the
// component's bundled `<script>`.
//
// Shape: a `display: contents` wrapper around the static CopyHashButton markup (the
// react-aria `<button type="button" aria-label>` rendered server-side), so the button
// still positions against its heading. On press (`click` — mouse, touch, keyboard and
// assistive tech alike): copy this page's `#slug` link, flash `data-copied` for
// COPIED_RESET_MS on success, then — `anchored` — scroll the enclosing heading into
// view (reduced-motion aware) and put the fragment in the URL, as the React island did.
//
// react-aria parity: the styles key the hover tint on `[data-hovered]`, which react-aria
// sets for mouse / pen hover but never for touch (no sticky tap tint), so the element
// sets it the same way. `_focusVisible` matches native `:focus-visible`.
export const COPY_HASH_BUTTON_TAG = 'copy-hash-button';

const isTouch = (event: Event) => event instanceof PointerEvent && event.pointerType === 'touch';

export class CopyHashButtonElement extends HTMLElement {
  #reset: ReturnType<typeof setTimeout> | undefined;

  #button(): HTMLButtonElement | null {
    const button = this.firstElementChild;
    return button instanceof HTMLButtonElement ? button : null;
  }

  #abort: AbortController | undefined;

  connectedCallback() {
    const button = this.#button();
    if (button === null) return;
    this.#abort?.abort();
    this.#abort = new AbortController();
    const { signal } = this.#abort;
    button.addEventListener('click', () => this.#press(button), { signal });
    button.addEventListener('pointerenter', (event) => this.#hover(button, event), { signal });
    button.addEventListener('pointerleave', () => button.removeAttribute('data-hovered'), { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = undefined;
    clearTimeout(this.#reset);
    this.#reset = undefined;
    const button = this.#button();
    button?.removeAttribute('data-copied');
    button?.removeAttribute('data-hovered');
  }

  async #press(button: HTMLButtonElement) {
    const slug = this.getAttribute('slug') ?? '';
    if (await copyHashLink(slug)) this.#flashCopied(button);
    if (this.hasAttribute('anchored')) jumpToHeading(enclosingHeading(this), slug, prefersReducedMotion());
  }

  #hover(button: HTMLButtonElement, event: Event) {
    if (isTouch(event)) return;
    button.setAttribute('data-hovered', 'true');
  }

  #flashCopied(button: HTMLButtonElement) {
    button.setAttribute('data-copied', 'true');
    clearTimeout(this.#reset);
    this.#reset = setTimeout(() => {
      this.#reset = undefined;
      button.removeAttribute('data-copied');
    }, COPIED_RESET_MS);
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineCopyHashButtonElement = () => {
  if (customElements.get(COPY_HASH_BUTTON_TAG) !== undefined) return;
  customElements.define(COPY_HASH_BUTTON_TAG, CopyHashButtonElement);
};
