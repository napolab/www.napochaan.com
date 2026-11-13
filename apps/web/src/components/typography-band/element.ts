import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

import { bindBand } from './bind-band';

import type { BandTracks } from './bind-band';

// `<typography-band>` — the framework-free driver of ./typography-band.astro (no React
// island). Client-only: imported solely from the component's bundled `<script>`.
//
// Shape: a `display: contents` WRAPPER (class set in the .astro) around the four fixed
// bands the React TypographyBand renders — no box, so the bands still paint above the
// safe-area tint by DOM order. The element carries `transition:persist`.
//
// Persist: Astro's swap moves the persisted node twice (to <html>, then into the new
// body) — with moveBefore or appendChild, each a synchronous disconnect + connect — and
// the incoming page's own <typography-band> connects for a moment before it is
// replaced. So both callbacks only schedule a microtask reconcile that looks at where
// the element ENDED UP: still connected → keep the running drift (no reset, no second
// frame loop); gone → tear everything down. A same-task connect + remove binds nothing.
//
// Reduced motion (OS + header toggle) is checked BEFORE bindBand(), so a reduced-motion
// visitor gets no frame loop and no scroll listeners at all (the React island's
// hydration effect saw the server snapshot reduced=false and bound it on every page).
// bindBand() itself is gsap-free (plain rAF), so the band never fetches gsap.
export const TYPOGRAPHY_BAND_TAG = 'typography-band';

const resolveTracks = (element: HTMLElement): BandTracks | null => {
  const [top, bottom, left, right] = [...element.children].map((band) => band.firstElementChild);
  if (!(top instanceof HTMLElement) || !(bottom instanceof HTMLElement)) return null;
  if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) return null;

  return { top, bottom, left, right };
};

export class TypographyBandElement extends HTMLElement {
  #dispose: (() => void) | undefined;
  #unsubscribe: (() => void) | undefined;

  connectedCallback() {
    queueMicrotask(() => this.#reconcile());
  }

  disconnectedCallback() {
    queueMicrotask(() => this.#reconcile());
  }

  #reconcile() {
    if (!this.isConnected) {
      this.#unsubscribe?.();
      this.#unsubscribe = undefined;
      this.#stop();
      return;
    }
    if (this.#unsubscribe !== undefined) return; // already live: a persist move
    this.#unsubscribe = subscribeReducedMotion(() => this.#sync());
    this.#sync();
  }

  #sync() {
    if (prefersReducedMotion()) {
      this.#stop();
      return;
    }
    if (this.#dispose !== undefined) return;
    const tracks = resolveTracks(this);
    if (tracks === null) return;
    this.#dispose = bindBand(tracks);
  }

  #stop() {
    this.#dispose?.();
    this.#dispose = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineTypographyBandElement = () => {
  if (customElements.get(TYPOGRAPHY_BAND_TAG) !== undefined) return;
  customElements.define(TYPOGRAPHY_BAND_TAG, TypographyBandElement);
};
