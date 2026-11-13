import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CURSOR_PRESENCE_DEMO_TAG, defineCursorPresenceDemoElement } from './cursor-presence-demo-element';

// The markup cursor-presence-demo.astro renders: the sized cell + the cursor canvas.
const mount = () => {
  const container = document.createElement('div');
  container.innerHTML = `<${CURSOR_PRESENCE_DEMO_TAG}><div style="width: 300px; height: 144px;"><canvas aria-hidden="true" style="display: block; width: 100%; height: 100%;"></canvas></div></${CURSOR_PRESENCE_DEMO_TAG}>`;
  document.body.appendChild(container);
  const element = container.querySelector(CURSOR_PRESENCE_DEMO_TAG);
  const canvas = container.querySelector('canvas');
  if (element === null || canvas === null) throw new Error('not rendered');
  return { element, canvas };
};

const inked = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('no 2d context');
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data.some((value) => value !== 0);
};

// The colophon CursorPresence demo: the real cursor canvas loop fed the socket-free
// sample visitors, drawn straight into the cell — no React, no socket.
describe('<cursor-presence-demo>', () => {
  beforeEach(() => {
    defineCursorPresenceDemoElement();
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineCursorPresenceDemoElement()).not.toThrow();
    expect(customElements.get(CURSOR_PRESENCE_DEMO_TAG)).toBeDefined();
  });

  it('draws the sample visitors into its cell and keeps them moving', () => {
    const { canvas } = mount();
    vi.advanceTimersByTime(32);
    expect(inked(canvas)).toBe(true);
    expect(vi.getTimerCount()).toBeGreaterThan(1); // the frame loop + the sample hop timer
  });

  it('stops the sample visitors and the frame loop when removed', () => {
    const { element } = mount();
    vi.advanceTimersByTime(32);

    element.remove();
    expect(vi.getTimerCount()).toBe(0);
  });
});
