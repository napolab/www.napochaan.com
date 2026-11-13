import { defaultBootStore } from '@components/boot-status/default-store';
import { isSwapping, subscribeSwap } from '@utils/client-router-swap';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

import { bindEcho } from './bind-echo';

import type { EchoBinding } from './bind-echo';

// `<echo-text>` — the framework-free driver of ./echo-text.astro (no React island).
// Client-only: this module extends HTMLElement at module scope, so it is imported
// solely from the component's bundled `<script>`, never from frontmatter.
//
// Shape: a `display: contents` WRAPPER (class set in the .astro) around the root span
// the React EchoText renders (role="img", aria-label = the wordmark), so the hero /
// masthead layout and the parity tests see the same tree. The resting text is read
// from that aria-label — never the fill, which may be frozen mid-scramble.
//
// Binds (./bind-echo, shared with the React EchoText) once the boot overlay has lifted,
// never under reduced motion (checked BEFORE the gsap chunk is requested), and not
// mid-ClientRouter-swap: the decode measures the fill's width, so it waits for
// astro:page-load (see @utils/client-router-swap).
export const ECHO_TEXT_TAG = 'echo-text';

const resolveBinding = (element: HTMLElement): EchoBinding | null => {
  const root = element.firstElementChild;
  if (!(root instanceof HTMLElement)) return null;
  const fill = root.querySelector('[data-scramble]');
  if (!(fill instanceof HTMLElement)) return null;

  return { root, fill, text: root.getAttribute('aria-label') ?? '' };
};

// Inputs that change whether the decode is bound. A notification that leaves them
// unchanged (e.g. the motion key re-written with the same value) must not restart it.
const bindKey = (reduced: boolean, bootReady: boolean, swapping: boolean) => `${reduced}:${bootReady}:${swapping}`;

export class EchoTextElement extends HTMLElement {
  #dispose: (() => void) | undefined;
  #unsubscribes: (() => void)[] = [];
  #key: string | undefined;

  connectedCallback() {
    const onChange = () => this.#sync();
    // Subscribe BEFORE reading the boot snapshot (the store wires its observer then).
    this.#unsubscribes = [subscribeReducedMotion(onChange), defaultBootStore.subscribe(onChange), subscribeSwap(onChange)];
    this.#sync();
  }

  disconnectedCallback() {
    for (const unsubscribe of this.#unsubscribes) unsubscribe();
    this.#unsubscribes = [];
    this.#key = undefined;
    this.#teardown();
  }

  #sync() {
    const reduced = prefersReducedMotion();
    const bootReady = defaultBootStore.getSnapshot().ready;
    const swapping = isSwapping();
    const key = bindKey(reduced, bootReady, swapping);
    if (key === this.#key) return;
    this.#key = key;
    this.#teardown();
    if (reduced || !bootReady || swapping) return;
    const binding = resolveBinding(this);
    if (binding === null) return;
    this.#dispose = bindEcho(binding);
  }

  // bindEcho's dispose heals the resting wordmark (text + unpinned box).
  #teardown() {
    this.#dispose?.();
    this.#dispose = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineEchoTextElement = () => {
  if (customElements.get(ECHO_TEXT_TAG) !== undefined) return;
  customElements.define(ECHO_TEXT_TAG, EchoTextElement);
};
