import { containerResizer } from '@components/canvas-resize/container-resizer';
import { bindCursorLayer } from '@components/cursor-presence/bind-cursor-layer';
import { containerPlacement } from '@components/cursor-presence/placement';
import { readCursorColor } from '@components/cursor-presence/read-cursor-color';

import { createSampleVisitorApp } from './sample-visitor-app';

// `<cursor-presence-demo>` — the colophon CursorPresence demo (./cursor-presence-demo.astro),
// no React island. The real cursor canvas loop (@components/cursor-presence/bind-cursor-layer,
// shared with the site's <cursor-presence>) fed the socket-free sample engine
// (./sample-visitor-app), with container placement + the container resizer, so the
// cursors map straight into the cell. Lives in <main> (never persisted), so a plain
// connect / disconnect pair binds and tears down. Client-only: imported solely from
// the component's bundled `<script>`.
export const CURSOR_PRESENCE_DEMO_TAG = 'cursor-presence-demo';

export class CursorPresenceDemoElement extends HTMLElement {
  #dispose: (() => void) | undefined;

  connectedCallback() {
    if (this.#dispose !== undefined) return;
    const canvas = this.querySelector('canvas');
    if (canvas === null) return;
    const app = createSampleVisitorApp();
    app.start();
    const unbind = bindCursorLayer({ canvas, app, enabled: true, getColor: readCursorColor, placement: containerPlacement, resizer: containerResizer });
    this.#dispose = () => {
      unbind();
      app.end();
    };
  }

  disconnectedCallback() {
    this.#dispose?.();
    this.#dispose = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineCursorPresenceDemoElement = () => {
  if (customElements.get(CURSOR_PRESENCE_DEMO_TAG) !== undefined) return;
  customElements.define(CURSOR_PRESENCE_DEMO_TAG, CursorPresenceDemoElement);
};
