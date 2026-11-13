import { defaultBootStore } from '@components/boot-status/default-store';
import { textNodes, writeBeforeCaret } from '@components/typewriter-text/typed-text';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';
import { createTypewriter } from '@utils/typewriter';

import { HOLD_MS, nextIndex, shuffle } from './cycle';
import { QUESTIONS } from '../questions';

import type { Typewriter } from '@utils/typewriter';

// `<boot-question>` — the framework-free driver of ./boot-question.astro (no React
// island): the boot overlay's typed prompt. Client-only: imported solely from the
// component's bundled `<script>`, never from frontmatter.
//
// Shape: a `display: contents` wrapper around the caret span, so the typed text lands
// inline in the status <p> exactly where the React BootQuestion rendered it.
//
// Behaviour mirrors BootQuestion: a fresh shuffled order per element; type one prompt,
// hold HOLD_MS, advance, forever — but ONLY while the boot phase is active. Once
// `html.boot` drops the overlay is visibility:hidden yet this element stays connected,
// so every timer stops and the line freezes (no invisible layout shifts counted toward
// CLS). Under reduced motion the prompt jumps to its full text and never cycles.
export const BOOT_QUESTION_TAG = 'boot-question';

type Line = { typewriter: Typewriter; unsubscribe: () => void };

export class BootQuestionElement extends HTMLElement {
  #order: string[] = [];
  #index = 0;
  #line: Line | undefined;
  #hold: ReturnType<typeof setTimeout> | undefined;
  #unsubscribes: (() => void)[] = [];

  connectedCallback() {
    if (this.#order.length === 0) this.#order = shuffle(QUESTIONS, Math.random);
    const onChange = () => this.#sync();
    // Subscribe BEFORE reading the boot snapshot (the store wires its observer then).
    this.#unsubscribes = [subscribeReducedMotion(onChange), defaultBootStore.subscribe(onChange)];
    this.#sync();
  }

  disconnectedCallback() {
    for (const unsubscribe of this.#unsubscribes) unsubscribe();
    this.#unsubscribes = [];
    this.#freeze();
  }

  #caret(): Element | null {
    return this.lastElementChild;
  }

  #active(): boolean {
    return !defaultBootStore.getSnapshot().ready;
  }

  #currentLine(): Line {
    if (this.#line !== undefined) return this.#line;
    const text = this.#order[this.#index] ?? QUESTIONS[0];
    const typewriter = createTypewriter(text);
    const unsubscribe = typewriter.subscribe(() => this.#onType(typewriter));
    this.#line = { typewriter, unsubscribe };
    return this.#line;
  }

  // Boot over → freeze; reduced → the full prompt, no cycling; otherwise type on.
  #sync() {
    if (!this.#active()) {
      this.#freeze();
      return;
    }
    const { typewriter } = this.#currentLine();
    if (prefersReducedMotion()) {
      this.#cancelHold();
      typewriter.finish();
      return;
    }
    typewriter.start();
    this.#scheduleHold(typewriter);
  }

  #onType(typewriter: Typewriter) {
    const caret = this.#caret();
    if (caret !== null) writeBeforeCaret(caret, textNodes(typewriter.getSnapshot().displayText));
    this.#scheduleHold(typewriter);
  }

  #scheduleHold(typewriter: Typewriter) {
    if (!typewriter.getSnapshot().isDone || this.#hold !== undefined) return;
    if (prefersReducedMotion() || !this.#active()) return;
    this.#hold = setTimeout(() => this.#advance(), HOLD_MS);
  }

  #advance() {
    this.#hold = undefined;
    this.#dropLine();
    this.#index = nextIndex(this.#index, this.#order.length);
    this.#sync();
  }

  #dropLine() {
    this.#line?.typewriter.stop();
    this.#line?.unsubscribe();
    this.#line = undefined;
  }

  #cancelHold() {
    clearTimeout(this.#hold);
    this.#hold = undefined;
  }

  #freeze() {
    this.#cancelHold();
    this.#line?.typewriter.stop();
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineBootQuestionElement = () => {
  if (customElements.get(BOOT_QUESTION_TAG) !== undefined) return;
  customElements.define(BOOT_QUESTION_TAG, BootQuestionElement);
};
