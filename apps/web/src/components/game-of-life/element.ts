import { containerResizer } from '@components/canvas-resize/container-resizer';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

import { bindLifeCanvas, startLifeLoop } from './bind-life';
import { createPlaceholderLifeEngine, sharedLifeEngine } from './shared-engine';

import type { LifeEngine } from './engine';

// `<game-of-life>` — the framework-free driver of ./game-of-life.astro (no React
// island). Client-only: imported solely from the component's bundled `<script>`.
//
// Shape: a `display: contents` WRAPPER (class set in the .astro) around the canvas the
// React GameOfLife renders; the caller's box (the fixed life frame, a demo cell)
// decides the size. Sizing and the 7fps loop come from ./bind-life, shared with the
// React GameOfLife.
//
// Engine: the module-level shared engine (./shared-engine — the SysBar reads its gen /
// alive) by default; `engine="isolated"` gives the element its own, so the colophon
// demo never disturbs the background's generation count.
//
// Persist: the page-background frame carries `transition:persist`. Astro's swap moves
// the persisted node twice (to <html>, then into the new body) — each a synchronous
// disconnect + connect — and the incoming page's own frame connects for a moment
// before it is replaced. So both callbacks only schedule a microtask reconcile that
// looks at where the element ENDED UP: still connected → keep the running simulation
// (no re-seed, no second loop); gone → tear everything down
// (typography-band/element.ts does the same).
//
// Reduced motion (OS + header toggle): the grid is still sized and drawn once, but no
// loop runs; the subscription starts / stops the loop live.
export const GAME_OF_LIFE_TAG = 'game-of-life';

const resolveEngine = (element: HTMLElement): LifeEngine => (element.getAttribute('engine') === 'isolated' ? createPlaceholderLifeEngine() : sharedLifeEngine);

export class GameOfLifeElement extends HTMLElement {
  #engine: LifeEngine | undefined;
  #unbindCanvas: (() => void) | undefined;
  #stopLoop: (() => void) | undefined;
  #unsubscribe: (() => void) | undefined;

  connectedCallback() {
    queueMicrotask(() => this.#reconcile());
  }

  disconnectedCallback() {
    queueMicrotask(() => this.#reconcile());
  }

  #reconcile() {
    if (!this.isConnected) {
      this.#teardown();
      return;
    }
    if (this.#unbindCanvas !== undefined) return; // already live: a persist move
    const canvas = this.querySelector('canvas');
    if (canvas === null) return;
    this.#engine ??= resolveEngine(this);
    this.#unbindCanvas = bindLifeCanvas({ canvas, engine: this.#engine, resizer: containerResizer });
    this.#unsubscribe = subscribeReducedMotion(() => this.#sync());
    this.#sync();
  }

  #sync() {
    if (prefersReducedMotion()) {
      this.#stop();
      return;
    }
    if (this.#stopLoop !== undefined) return;
    const canvas = this.querySelector('canvas');
    if (canvas === null || this.#engine === undefined) return;
    this.#stopLoop = startLifeLoop({ canvas, engine: this.#engine });
  }

  #stop() {
    this.#stopLoop?.();
    this.#stopLoop = undefined;
  }

  #teardown() {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#stop();
    this.#unbindCanvas?.();
    this.#unbindCanvas = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineGameOfLifeElement = () => {
  if (customElements.get(GAME_OF_LIFE_TAG) !== undefined) return;
  customElements.define(GAME_OF_LIFE_TAG, GameOfLifeElement);
};
