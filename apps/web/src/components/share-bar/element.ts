import { COPIED_RESET_MS, shareOrCopy } from '@utils/share';

import { COPIED_LABEL, SHARE_LABEL } from './labels';

// `<share-bar share-url="…" share-title="…">` — the framework-free driver of ./share-bar.astro (no
// React island). Client-only: imported solely from the component's bundled `<script>`.
//
// Shape: a `display: contents` wrapper around the static ShareBar markup (rendered
// server-side from the React ShareBar without a directive): the X intent is a plain
// link; the share `<button>` is wired here. On press (`click` — every input modality):
// hand the canonical URL to the OS share sheet, falling back to a clipboard copy
// (@utils/share, shared with the React useShare); after a successful copy the button's
// label — its accessible name — reads "copied ✓" for COPIED_RESET_MS, then "share"
// again, exactly as the React island did. The Button styles key on native
// pseudo-classes, so the unhydrated button looks identical.
export const SHARE_BAR_TAG = 'share-bar';

// The button's label: its last text node (after the share icon).
const labelOf = (button: HTMLButtonElement): Text | null => {
  const last = button.lastChild;
  return last instanceof Text ? last : null;
};

export class ShareBarElement extends HTMLElement {
  #reset: ReturnType<typeof setTimeout> | undefined;

  #button(): HTMLButtonElement | null {
    return this.querySelector('button');
  }

  #abort: AbortController | undefined;

  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.#button()?.addEventListener('click', () => this.#press(), { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = undefined;
    this.#setLabel(SHARE_LABEL);
  }

  async #press() {
    // Not `title`: a title attribute would tooltip the whole bar.
    const url = this.getAttribute('share-url') ?? '';
    const title = this.getAttribute('share-title') ?? '';
    try {
      if ((await shareOrCopy({ title, url }, url)) === 'copied') this.#flashCopied();
    } catch (error) {
      console.error(error);
    }
  }

  #setLabel(text: string) {
    clearTimeout(this.#reset);
    this.#reset = undefined;
    const button = this.#button();
    const label = button === null ? null : labelOf(button);
    if (label !== null) label.data = text;
  }

  #flashCopied() {
    this.#setLabel(COPIED_LABEL);
    this.#reset = setTimeout(() => this.#setLabel(SHARE_LABEL), COPIED_RESET_MS);
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineShareBarElement = () => {
  if (customElements.get(SHARE_BAR_TAG) !== undefined) return;
  customElements.define(SHARE_BAR_TAG, ShareBarElement);
};
