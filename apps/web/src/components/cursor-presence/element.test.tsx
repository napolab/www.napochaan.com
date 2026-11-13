import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';

import { CURSOR_PRESENCE_TAG, defineCursorPresenceElement } from './element';
import { getPresenceCount, PRESENCE_ENABLED_KEY, publishPresenceCount, togglePresenceEnabled } from './presence-count';

import type { VisitorPointerApp, VisitorPointerState } from '@lib/cursor/visitor-pointer-app';

// The socket app is the lazy wrapper around the real WebSocket client; stand in a
// controllable one and record every instance the element creates.
const { apps } = vi.hoisted(() => ({ apps: [] as Array<{ app: VisitorPointerApp; emit: (count: number) => void; started: () => number; ended: () => number }> }));

vi.mock('@lib/cursor/lazy-visitor-pointer-app', async () => {
  const { vi: spy } = await import('vitest');
  return {
    createLazyVisitorPointerApp: (): VisitorPointerApp => {
      const listeners = new Set<(state: VisitorPointerState) => void>();
      const box = { state: { visitors: new Map(), count: 0 } as VisitorPointerState };
      const app: VisitorPointerApp = {
        start: spy.fn(),
        end: spy.fn(),
        setChannel: spy.fn(),
        send: spy.fn(),
        getState: () => box.state,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
      const emit = (count: number) => {
        box.state = { ...box.state, count };
        for (const listener of listeners) listener(box.state);
      };
      apps.push({ app, emit, started: () => vi.mocked(app.start).mock.calls.length, ended: () => vi.mocked(app.end).mock.calls.length });
      return app;
    },
  };
});

// The markup cursor-presence.astro renders.
const markup = `<${CURSOR_PRESENCE_TAG}><div><canvas aria-hidden="true"></canvas></div></${CURSOR_PRESENCE_TAG}>`;

const addStage = (): HTMLDivElement => {
  const stage = document.createElement('div');
  stage.setAttribute('data-cursor-surface', '');
  stage.style.cssText = 'width: 400px; height: 400px;';
  document.body.appendChild(stage);
  return stage;
};

const mount = () => {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.appendChild(container);
  const element = container.querySelector(CURSOR_PRESENCE_TAG);
  if (element === null) throw new Error('not rendered');
  return { container, element };
};

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const latest = () => {
  const entry = apps.at(-1);
  if (entry === undefined) throw new Error('no app created');
  return entry;
};

describe('<cursor-presence>', () => {
  beforeEach(() => {
    defineCursorPresenceElement();
    write(PRESENCE_ENABLED_KEY, true);
  });

  afterEach(async () => {
    document.body.replaceChildren();
    await settle();
    publishPresenceCount(0);
    write(PRESENCE_ENABLED_KEY, true);
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineCursorPresenceElement()).not.toThrow();
    expect(customElements.get(CURSOR_PRESENCE_TAG)).toBeDefined();
  });

  it('opens presence on the current path and publishes the visitor count for the SysBar', async () => {
    mount();
    await settle();
    const { app, emit, started } = latest();
    expect(started()).toBe(1);
    expect(app.setChannel).toHaveBeenLastCalledWith(location.pathname);

    emit(3);
    expect(getPresenceCount()).toBe(3);
  });

  // The element is persisted, so it never re-renders from the server: the channel
  // follows the soft navigation the way usePathname did.
  it('moves to the new path channel after each soft navigation', async () => {
    mount();
    await settle();
    const { app } = latest();
    const initial = `${location.pathname}${location.search}`;
    history.replaceState(null, '', '/works/alpha');
    document.dispatchEvent(new Event('astro:page-load'));

    expect(app.setChannel).toHaveBeenLastCalledWith('/works/alpha');
    history.replaceState(null, '', initial);
  });

  it('follows the cursors opt-out: closes presence when off, reopens when back on', async () => {
    mount();
    await settle();
    const { started, ended } = latest();

    togglePresenceEnabled();
    expect(ended()).toBe(1);

    togglePresenceEnabled();
    expect(started()).toBe(2);
  });

  it('opens nothing while the visitor has opted out', async () => {
    write(PRESENCE_ENABLED_KEY, false);
    mount();
    await settle();

    expect(latest().started()).toBe(0);
  });

  it('broadcasts fine-pointer moves normalized to the stage', async () => {
    addStage();
    mount();
    await settle();
    const { app } = latest();
    if (!matchMedia('(pointer:fine)').matches) return;

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
    expect(app.send).toHaveBeenCalledTimes(1);
  });

  // Same-path swap (refresh / query-only navigation): the old stage is replaced.
  it('re-resolves the stage after every ClientRouter swap, even when the pathname is unchanged', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const first = addStage();
    mount();
    await settle();
    expect(observe.mock.calls.some(([el]) => el === first)).toBe(true);

    first.remove();
    const second = addStage();
    document.dispatchEvent(new Event('astro:after-swap'));

    expect(observe.mock.calls.some(([el]) => el === second)).toBe(true);
  });

  // transition:persist moves the element (to <html>, then into the new body): each move
  // is a synchronous disconnect + connect. The socket must stay open — no end(), no
  // second start(), no second app.
  it('keeps the socket across a synchronous persist move', async () => {
    const { container } = mount();
    await settle();
    const created = apps.length;
    const { started, ended, emit } = latest();
    emit(2);

    document.documentElement.appendChild(container);
    document.body.appendChild(container);
    await settle();

    expect(apps.length).toBe(created);
    expect(started()).toBe(1);
    expect(ended()).toBe(0);
    expect(getPresenceCount()).toBe(2);
  });

  it('closes the socket and clears the count when it is really removed', async () => {
    const { element } = mount();
    await settle();
    const { ended, emit } = latest();
    emit(2);

    element.remove();
    await settle();

    expect(ended()).toBe(1);
    expect(getPresenceCount()).toBe(0);
  });

  // The swap briefly connects the incoming page's own <cursor-presence> before the
  // persisted one replaces it: that transient element must open nothing.
  it('opens nothing for an element connected and removed in the same task', async () => {
    const created = apps.length;
    const { element } = mount();
    element.remove();
    await settle();

    const opened = apps.slice(created).reduce((sum, entry) => sum + entry.started(), 0);
    expect(opened).toBe(0);
  });
});
