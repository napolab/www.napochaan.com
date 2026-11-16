import { SCROLL_RANGE_HOST_ATTRIBUTE, bindScrollRange } from './bind-scroll-range';

// `<scroll-range-sync>` — the framework-free driver inside ./safe-area-tint.astro (no
// React island). Client-only: imported solely from the component's bundled `<script>`.
// An empty element (the React ScrollRangeSync renders nothing): while connected it
// binds ./bind-scroll-range to its host — the tint root, marked explicitly with
// SCROLL_RANGE_HOST_ATTRIBUTE. The tint root persists across navigations; a persist
// move (disconnect + connect) just re-measures, and astro:after-swap moves the body
// observer to the swapped-in <body>.
export const SCROLL_RANGE_SYNC_TAG = 'scroll-range-sync';

export class ScrollRangeSyncElement extends HTMLElement {
  #dispose: (() => void) | undefined;

  connectedCallback() {
    this.#dispose?.();
    this.#dispose = undefined;
    const host = this.closest<HTMLElement>(`[${SCROLL_RANGE_HOST_ATTRIBUTE}]`);
    if (host === null) return;
    this.#dispose = bindScrollRange(host);
  }

  disconnectedCallback() {
    this.#dispose?.();
    this.#dispose = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineScrollRangeSyncElement = () => {
  if (customElements.get(SCROLL_RANGE_SYNC_TAG) !== undefined) return;
  customElements.define(SCROLL_RANGE_SYNC_TAG, ScrollRangeSyncElement);
};
