import { defaultBootStore } from '@components/boot-status/default-store';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';
import { createTypewriter } from '@utils/typewriter';

import { textNodes, writeBeforeCaret } from './typed-text';

import type { Typewriter } from '@utils/typewriter';

// `<typewriter-text>` — the framework-free driver of ./typewriter-text.astro (no React
// island). Client-only: this module extends HTMLElement at module scope, so it is
// imported solely from the component's bundled `<script>`, never from frontmatter.
//
// Shape: a `display: contents` WRAPPER (class set in the .astro) around the markup the
// React TypewriterText renders — [srOnly, typeWrap (aria-hidden) → [sizer, typed →
// [caret]]] — so hosts' <p>/<blockquote> styles and the parity tests see the same tree.
//
// Behaviour mirrors TypewriterText + useTypewriter: typing waits for the boot overlay
// to lift, reduced motion (OS + header toggle) jumps straight to the full text, and
// with `phrase` the finished overlay swaps in the sizer's phrased copy (BudouX <wbr>
// already rendered on the server — cloned, so no segmenter ships to the client).
// The controller lives on the instance: a disconnect (persist move, swap) freezes the
// keystrokes and a reconnect resumes from there.
export const TYPEWRITER_TEXT_TAG = 'typewriter-text';

type Parts = { sizer: Element; caret: Element; text: string };

const resolveParts = (element: HTMLElement): Parts | null => {
  const [srOnly, typeWrap] = element.children;
  const sizer = typeWrap?.children[0];
  const caret = typeWrap?.children[1]?.lastElementChild;
  if (srOnly === undefined || sizer === undefined || caret === null || caret === undefined) return null;

  return { sizer, caret, text: srOnly.textContent ?? '' };
};

export class TypewriterTextElement extends HTMLElement {
  #typewriter: Typewriter | undefined;
  #unsubscribes: (() => void)[] = [];

  connectedCallback() {
    const parts = resolveParts(this);
    if (parts === null) return;
    const typewriter = this.#typewriter ?? createTypewriter(parts.text);
    this.#typewriter = typewriter;
    const onChange = () => this.#sync(typewriter);
    // Subscribe BEFORE reading the boot snapshot: the store only wires its observer
    // (and settles to READY when there is no overlay) on the first subscribe.
    this.#unsubscribes = [typewriter.subscribe(() => this.#render(parts, typewriter)), subscribeReducedMotion(onChange), defaultBootStore.subscribe(onChange)];
    this.#render(parts, typewriter);
    this.#sync(typewriter);
  }

  disconnectedCallback() {
    for (const unsubscribe of this.#unsubscribes) unsubscribe();
    this.#unsubscribes = [];
    this.#typewriter?.stop();
  }

  // useTypewriter's effect: nothing before boot, the full text under reduced motion,
  // otherwise (re)start typing.
  #sync(typewriter: Typewriter) {
    if (!defaultBootStore.getSnapshot().ready) return;
    if (prefersReducedMotion()) {
      typewriter.finish();
      return;
    }
    typewriter.start();
  }

  #render({ sizer, caret }: Parts, typewriter: Typewriter) {
    const { displayText, isDone } = typewriter.getSnapshot();
    const phrased = isDone && this.hasAttribute('phrase');
    writeBeforeCaret(caret, phrased ? [...sizer.childNodes].map((node) => node.cloneNode(true)) : textNodes(displayText));
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineTypewriterTextElement = () => {
  if (customElements.get(TYPEWRITER_TEXT_TAG) !== undefined) return;
  customElements.define(TYPEWRITER_TEXT_TAG, TypewriterTextElement);
};
