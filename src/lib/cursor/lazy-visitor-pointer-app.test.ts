import { describe, expect, it, vi } from 'vitest';

import type { VisitorPointerApp, VisitorPointerState } from './visitor-pointer-app';

// vi.mock is hoisted above every import, so the fake must be built inside
// vi.hoisted or the factory would read `real` before initialisation.
const { real } = vi.hoisted(() => {
  const listeners = new Set<(s: VisitorPointerState) => void>();
  const state: { value: VisitorPointerState } = { value: { visitors: new Map(), count: 0 } };
  const app: VisitorPointerApp & { emit: (s: VisitorPointerState) => void } = {
    start: vi.fn(),
    end: vi.fn(),
    setChannel: vi.fn(),
    send: vi.fn(),
    getState: () => state.value,
    subscribe: (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    emit: (s) => {
      state.value = s;
      for (const l of listeners) l(s);
    },
  };
  return { real: app };
});

vi.mock('./visitor-pointer-app', () => ({ createVisitorPointerApp: () => real }));

describe('createLazyVisitorPointerApp', () => {
  it('exposes an empty state before start()', async () => {
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    expect(app.getState()).toEqual({ visitors: new Map(), count: 0 });
    expect(real.start).not.toHaveBeenCalled();
  });

  it('starts the real app on start(), replays the channel and forwards state', async () => {
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    const listener = vi.fn();
    app.subscribe(listener);
    app.setChannel('/works');
    app.start();
    await vi.waitFor(() => expect(real.start).toHaveBeenCalledOnce());
    expect(real.setChannel).toHaveBeenCalledWith('/works');
    real.emit({ visitors: new Map(), count: 3 });
    expect(listener).toHaveBeenCalledWith({ visitors: new Map(), count: 3 });
    expect(app.getState().count).toBe(3);
  });

  it('does not start the real app when end() races the import', async () => {
    vi.mocked(real.start).mockClear();
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    app.start();
    app.end();
    await new Promise((r) => setTimeout(r, 0));
    expect(real.start).not.toHaveBeenCalled();
  });

  it('forwards send() only once started', async () => {
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    app.send({ x: 0.1, y: 0.2 });
    expect(real.send).not.toHaveBeenCalled();
    app.start();
    await vi.waitFor(() => expect(real.start).toHaveBeenCalled());
    app.send({ x: 0.3, y: 0.4 });
    expect(real.send).toHaveBeenCalledWith({ x: 0.3, y: 0.4 });
  });
});
