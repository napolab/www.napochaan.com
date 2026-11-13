import { defaultBootStore } from '@components/boot-status/default-store';
import { isSwapping, subscribeSwap } from '@utils/client-router-swap';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

import { bindScramble, healFill } from './bind-scramble';

// `<scramble-text>` — the framework-free driver of ./scramble-text.astro (no React
// island). Client-only: this module extends HTMLElement at module scope, so it is
// imported solely from the component's bundled `<script>`, never from frontmatter.
//
// Why a custom element and not a run-once script: connectedCallback /
// disconnectedCallback fire on every insertion / removal, so the decode rebinds
// after a <ClientRouter /> soft navigation swaps the body in, and a
// `transition:persist` move (disconnect → connect) tears down and rebinds cleanly.
//
// Shape: the element is a `display: contents` WRAPPER around the root span (class
// set in the .astro, so it applies before upgrade). It generates no box, so every
// caller's layout and the styles.css.ts selectors see exactly the tree the React
// island produced (whose <astro-island> wrapper was display: contents too), and the
// inner markup stays byte-identical to the React ScrambleText.
//
// Markup contract (scramble-text.astro): first element child = root span, whose
// children are [srOnly, ghost (aria-hidden), fill (aria-hidden), trailing?]. The
// resting text is read from the srOnly copy — never the fill, which may be frozen
// mid-scramble.
//
// trigger="group": the hover host is the nearest ancestor carrying
// `data-scramble-host` — marked explicitly by the caller, never guessed by walking
// up to some generic parent.
export const SCRAMBLE_TEXT_TAG = 'scramble-text';

const HOST_SELECTOR = '[data-scramble-host]';

type Parts = { root: HTMLElement; fill: HTMLElement; text: string };

const resolveParts = (element: HTMLElement): Parts | null => {
  const root = element.firstElementChild;
  if (!(root instanceof HTMLElement)) return null;
  const [srOnly, , fill] = root.children;
  if (srOnly === undefined || !(fill instanceof HTMLElement)) return null;

  return { root, fill, text: srOnly.textContent ?? '' };
};

const resolveHost = (element: HTMLElement, root: HTMLElement): HTMLElement | null => {
  if (element.getAttribute('trigger') !== 'group') return root;
  const host = element.closest(HOST_SELECTOR);

  return host instanceof HTMLElement ? host : null;
};

// Inputs that change what the bind does. A notification that leaves them unchanged
// (e.g. the motion key re-written with the same value) must not interrupt a decode.
const bindKey = (reduced: boolean, bootReady: boolean, swapping: boolean) => `${reduced}:${bootReady}:${swapping}`;

export class ScrambleTextElement extends HTMLElement {
  #dispose: (() => void) | undefined;
  #unsubscribes: (() => void)[] = [];
  #key: string | undefined;

  connectedCallback() {
    const onChange = () => this.#sync();
    // Subscribe BEFORE reading the boot snapshot: the store only wires its observer
    // (and settles to READY when there is no overlay) on the first subscribe.
    this.#unsubscribes = [subscribeReducedMotion(onChange), defaultBootStore.subscribe(onChange), subscribeSwap(onChange)];
    this.#sync();
  }

  disconnectedCallback() {
    for (const unsubscribe of this.#unsubscribes) unsubscribe();
    this.#unsubscribes = [];
    this.#key = undefined;
    this.#teardown();
  }

  // (Re)binds when the effective reduced-motion preference (OS + header toggle), boot
  // readiness or the ClientRouter swap state changed. Reduced motion is checked BEFORE
  // bindScramble() so the gsap chunk is never requested for a reduced-motion visitor.
  // Mid-swap the bind waits for astro:page-load (see @utils/client-router-swap): the
  // window still holds the previous page's scroll, so the mobile `once` in-view
  // trigger would judge against a stale layout.
  #sync() {
    const reduced = prefersReducedMotion();
    const bootReady = defaultBootStore.getSnapshot().ready;
    const swapping = isSwapping();
    const key = bindKey(reduced, bootReady, swapping);
    if (key === this.#key) return;
    this.#key = key;
    this.#teardown();
    if (reduced || swapping) return;
    const parts = resolveParts(this);
    if (parts === null) return;
    this.#dispose = bindScramble({ ...parts, host: resolveHost(this, parts.root), bootReady });
  }

  // Unlike a React unmount, the DOM outlives this teardown (persist move, motion
  // toggle, boot rebind), so a decode reverted mid-hover would leave frozen glyphs:
  // heal the resting text on every teardown, desktop included.
  #teardown() {
    this.#dispose?.();
    this.#dispose = undefined;
    const parts = resolveParts(this);
    if (parts !== null) healFill(parts.fill, parts.text);
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineScrambleTextElement = () => {
  if (customElements.get(SCRAMBLE_TEXT_TAG) !== undefined) return;
  customElements.define(SCRAMBLE_TEXT_TAG, ScrambleTextElement);
};
