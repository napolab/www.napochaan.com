import { blankDimLabel, roundedSize } from './format';

// `<blank-dim ref-label="NN">` — the framework-free driver of ./blank-dim.astro (no
// React island). Client-only: imported solely from the component's bundled `<script>`.
//
// Shape: a `display: contents` wrapper around the aria-hidden callout span the React
// BlankDim renders. The span is absolutely positioned over its (CSS-sized) cell, so
// observing it measures the cell; the element prints that size as "W×H" above the
// reference number. Purely cosmetic and out of flow, so the runtime text never shifts
// layout. The reference number comes from the `ref-label` attribute, never parsed back
// out of the text this element overwrites.
export const BLANK_DIM_TAG = 'blank-dim';

export class BlankDimElement extends HTMLElement {
  #observer: ResizeObserver | undefined;

  connectedCallback() {
    const label = this.firstElementChild;
    if (label === null) return;
    const refLabel = this.getAttribute('ref-label') ?? '';
    this.#observer?.disconnect();
    this.#observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect !== undefined) label.textContent = blankDimLabel(refLabel, roundedSize(rect));
    });
    this.#observer.observe(label);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineBlankDimElement = () => {
  if (customElements.get(BLANK_DIM_TAG) !== undefined) return;
  customElements.define(BLANK_DIM_TAG, BlankDimElement);
};
