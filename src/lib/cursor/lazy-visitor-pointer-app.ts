'use client';

import type { VisitorPointerApp, VisitorPointerState } from './visitor-pointer-app';

type Listener = (state: VisitorPointerState) => void;

const EMPTY: VisitorPointerState = { visitors: new Map(), count: 0 };

// Same contract as createVisitorPointerApp, but the real app — and with it
// hono/client, zod (protocol), reconnecting-websocket and durabcast — is only
// imported on the first start(). Until then the state is empty and send() is a
// no-op, which is exactly what a visitor sees before the socket opens anyway.
// Keeps ~100 KB (decoded) out of the site layout's initial chunk graph.
export const createLazyVisitorPointerApp = (): VisitorPointerApp => {
  const listeners = new Set<Listener>();
  const box: {
    real: VisitorPointerApp | undefined;
    state: VisitorPointerState;
    channel: string | undefined;
    generation: number;
    unsubscribe: (() => void) | undefined;
  } = {
    real: undefined,
    state: EMPTY,
    channel: undefined,
    generation: 0,
    unsubscribe: undefined,
  };

  const publish = (state: VisitorPointerState): void => {
    box.state = state;
    for (const listener of listeners) listener(state);
  };

  const boot = async (generation: number): Promise<void> => {
    try {
      const { createVisitorPointerApp } = await import('./visitor-pointer-app');
      // end() bumped the generation while the import was in flight — stay idle.
      if (generation !== box.generation) return;
      const real = box.real ?? createVisitorPointerApp();
      box.real = real;
      box.unsubscribe?.();
      box.unsubscribe = real.subscribe(publish);
      if (box.channel !== undefined) real.setChannel(box.channel);
      real.start();
      publish(real.getState());
    } catch {
      // Chunk load failed (offline, flaky network, adblock, ...). Cursor presence is
      // purely decorative, so swallow it — this page load simply shows no presence.
    }
  };

  return {
    start() {
      box.generation += 1;
      void boot(box.generation);
    },
    end() {
      box.generation += 1;
      box.real?.end();
    },
    setChannel(channel) {
      box.channel = channel;
      box.real?.setChannel(channel);
    },
    send(position) {
      box.real?.send(position);
    },
    getState: () => box.state,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
