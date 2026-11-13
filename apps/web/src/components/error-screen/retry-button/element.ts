import { reloadPage } from './reload';

// `<retry-button>` — the framework-free driver of ./retry-button.astro (no React
// island): the 500 screen's retry. Client-only: imported solely from the component's
// bundled `<script>`.
//
// Shape: a `display: contents` wrapper around the static react-aria Button markup
// (`<button type="button">retry</button>`, rendered server-side by the .astro). A
// native button fires `click` for mouse, touch, keyboard (Enter / Space) and assistive
// tech alike, so one listener covers every press. The Button styles use native
// pseudo-classes (Panda `_hover` / `_focusVisible` / `_disabled` match `:hover`,
// `:focus-visible`, `:disabled`), so the unhydrated button looks identical.
export const RETRY_BUTTON_TAG = 'retry-button';

export class RetryButtonElement extends HTMLElement {
  // Injectable for tests: `location.reload` cannot be spied on reliably.
  reload: () => void = reloadPage;

  #abort: AbortController | undefined;

  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.addEventListener('click', (event) => this.#press(event), { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = undefined;
  }

  #press(event: Event) {
    if (!(event.target instanceof Element) || event.target.closest('button') === null) return;
    this.reload();
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineRetryButtonElement = () => {
  if (customElements.get(RETRY_BUTTON_TAG) !== undefined) return;
  customElements.define(RETRY_BUTTON_TAG, RetryButtonElement);
};
