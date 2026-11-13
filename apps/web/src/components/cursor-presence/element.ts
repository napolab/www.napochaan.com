import { containerResizer } from '@components/canvas-resize/container-resizer';
import { createLazyVisitorPointerApp } from '@lib/cursor/lazy-visitor-pointer-app';
import { defineCache } from '@utils/define-cache';

import { bindCursorLayer } from './bind-cursor-layer';
import { bindPointerSend } from './bind-pointer-send';
import { createSurfacePlacement } from './placement';
import { isPresenceEnabled, publishPresenceCount, subscribePresenceEnabled } from './presence-count';
import { readCursorColor } from './read-cursor-color';
import { resolveSurface } from './resolve-surface';
import { trackSurface } from './track-surface';

import type { VisitorPointerApp } from '@lib/cursor/visitor-pointer-app';

// `<cursor-presence>` — the framework-free driver of ./cursor-presence.astro (no React
// island). Client-only: imported solely from the component's bundled `<script>`.
//
// Shape: a `display: contents` WRAPPER (class set in the .astro) around the fixed
// full-viewport overlay + canvas the React CursorPresence renders. It owns the
// presence socket (the lazy app: hono/client, zod, the WebSocket client only load on
// the first start()), uses the current path as the presence channel, broadcasts this
// visitor's fine pointer normalized to the `[data-cursor-surface]` stage, draws every
// remote cursor (./bind-cursor-layer, shared with the React CursorLayer) and publishes
// the visitor count to ./presence-count for the SysBar's `watching N`. The `cursors:`
// opt-out (persistent store, flipped by the SysBar) closes the socket and clears the
// canvas; turning it back on reopens it.
//
// Persist: the element carries `transition:persist`. Astro's swap moves it twice (to
// <html>, then into the new body) — each a synchronous disconnect + connect — and the
// incoming page's own <cursor-presence> connects for a moment before it is replaced. So
// both callbacks only schedule a microtask reconcile that looks at where the element
// ENDED UP: still connected → keep the socket open (no end(), no second start()); gone
// → close it and publish a count of 0 (typography-band/element.ts does the same).
// Persisted, it never re-renders from the server: the channel follows
// `astro:page-load`, and the stage (replaced with <body> on every swap) is re-resolved
// after `astro:after-swap` (./track-surface).
export const CURSOR_PRESENCE_TAG = 'cursor-presence';

const PAGE_LOAD_EVENT = 'astro:page-load';

// One live binding of the element: the app, its canvas, the cursor-layer binder (run
// while enabled) and the teardown of everything that lives as long as the element.
type Session = {
  app: VisitorPointerApp;
  canvas: HTMLCanvasElement;
  bindLayer: () => () => void;
  dispose: () => void;
};

export class CursorPresenceElement extends HTMLElement {
  #app: VisitorPointerApp | undefined;
  #session: Session | undefined;
  #layer: (() => void) | undefined;
  #getColor = defineCache(readCursorColor);

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
    if (this.#session !== undefined) return; // already live: a persist move
    const canvas = this.querySelector('canvas');
    if (canvas === null) return;
    this.#app ??= createLazyVisitorPointerApp();
    this.#session = this.#open(this.#app, canvas);
    this.#syncEnabled();
  }

  // Everything that lives as long as the element is on the page, enabled or not.
  #open(app: VisitorPointerApp, canvas: HTMLCanvasElement): Session {
    const surface = trackSurface(() => resolveSurface(null));
    const setChannel = () => app.setChannel(location.pathname);
    setChannel();
    document.addEventListener(PAGE_LOAD_EVENT, setChannel);
    const disposers = [
      () => surface.dispose(),
      () => document.removeEventListener(PAGE_LOAD_EVENT, setChannel),
      app.subscribe((state) => publishPresenceCount(state.count)),
      bindPointerSend({ app, getRect: surface.getRect, isEnabled: isPresenceEnabled }),
      subscribePresenceEnabled(() => this.#syncEnabled()),
    ];
    const placement = createSurfacePlacement(surface.getRect);

    return {
      app,
      canvas,
      bindLayer: () => bindCursorLayer({ canvas, app, enabled: true, getColor: this.#getColor, placement, resizer: containerResizer }),
      dispose: () => {
        for (const dispose of disposers) dispose();
      },
    };
  }

  #syncEnabled() {
    const session = this.#session;
    if (session === undefined) return;
    if (!isPresenceEnabled()) {
      // Opted out: no socket, not counted by peers, nothing drawn.
      this.#closeLayer(session);
      session.app.end();
      return;
    }
    if (this.#layer !== undefined) return;
    session.app.start();
    this.#layer = session.bindLayer();
  }

  #closeLayer(session: Session) {
    this.#layer?.();
    this.#layer = undefined;
    session.canvas.getContext('2d')?.clearRect(0, 0, session.canvas.width, session.canvas.height);
  }

  #teardown() {
    const session = this.#session;
    if (session === undefined) return;
    this.#session = undefined;
    this.#closeLayer(session);
    session.dispose();
    session.app.end();
    publishPresenceCount(0);
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineCursorPresenceElement = () => {
  if (customElements.get(CURSOR_PRESENCE_TAG) !== undefined) return;
  customElements.define(CURSOR_PRESENCE_TAG, CursorPresenceElement);
};
