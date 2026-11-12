export type BootSnapshot = {
  ready: boolean;
};

export type BootStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => BootSnapshot;
};

const BOOT_CLASS = 'boot';
const BOOTING: BootSnapshot = { ready: false };
const READY: BootSnapshot = { ready: true };

// Factory for the boot-overlay store. `target` is the observed element — the
// document root in production, an injected node in tests. Kept lazy: `target` is
// only read inside `subscribe` (client-only), so creating a store at module
// scope (the context default) is SSR-safe. Stable snapshot identities (BOOTING /
// READY constants) keep useSyncExternalStore from looping.
export const createBootStore = (target?: HTMLElement): BootStore => {
  const listeners = new Set<() => void>();
  const cell = { snapshot: BOOTING };

  const resolve = () => target ?? document.documentElement;

  const settle = () => {
    cell.snapshot = READY;
    for (const listener of listeners) listener();
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      // The first subscriber while still booting wires the observer; later
      // consumers just share the snapshot.
      if (listeners.size === 1 && cell.snapshot === BOOTING) {
        const el = resolve();
        if (el.classList.contains(BOOT_CLASS)) {
          const observer = new MutationObserver(() => {
            if (el.classList.contains(BOOT_CLASS)) return;
            observer.disconnect();
            settle();
          });
          observer.observe(el, { attributes: true, attributeFilter: ['class'] });
        } else {
          cell.snapshot = READY;
        }
      }

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => cell.snapshot,
  };
};
