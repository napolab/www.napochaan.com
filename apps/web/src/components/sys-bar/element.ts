import { getPresenceCount, isPresenceEnabled, subscribePresenceCount, subscribePresenceEnabled, togglePresenceEnabled } from '@components/cursor-presence/presence-count';
import { sharedLifeEngine } from '@components/game-of-life/shared-engine';
import { isNavActive } from '@utils/is-nav-active';
import { bindMotionPlay, toggleMotion } from '@utils/motion-toggle';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

import { getClock, subscribeClock } from './clock-store';
import { trackTrigger } from './nav-menu/track-trigger';
import { aliveText, cursorsText, genText, motionText, watchingText } from './status-text';

import type { TriggerTracker } from './nav-menu/track-trigger';

// `<sys-bar>` — the framework-free driver of ./sys-bar.astro (no React island).
// Client-only: imported solely from the component's bundled `<script>`.
//
// Shape: a `display: contents` WRAPPER (class set in the .astro) around the React
// SysBar's markup (header + checker strip). The nav labels are `<scramble-text>`
// elements (they drive themselves); this element writes the live status row through
// its `data-status` / `data-toggle` hooks:
//   - clock: the server-stamped time is the first paint; the shared 1s clock store
//     (./clock-store, shared with the React useClock) takes over on connect.
//   - gen / alive: the shared life engine the <game-of-life> element ticks.
//   - watching N / `cursors:`: the presence store the <cursor-presence> element
//     publishes to; the toggle flips the persisted opt-out.
//   - `motion:`: the effective reduced-motion preference; the toggle stores the
//     override + boot cookie (@utils/motion-toggle), and the element keeps
//     `--motion-play` on <html> in step — on a page without React nothing else does.
//   - the active section: persisted, the bar never re-renders from the server, so
//     `data-active` follows `astro:page-load`.
//   - the mobile menu: the static trigger (./nav-menu/trigger-button) requests the
//     react-aria menu chunk (./nav-menu/mount — React loads only then) on its first
//     intent, remembering any press for the handoff (./nav-menu/track-trigger).
//
// Persist: the element carries `transition:persist`. Astro's swap moves it twice (to
// <html>, then into the new body) — each a synchronous disconnect + connect — and the
// incoming page's own <sys-bar> connects for a moment before it is replaced. So both
// callbacks only schedule a microtask reconcile that looks at where the element ENDED
// UP: still connected → keep every binding (no second clock, no double toggle); gone
// → release everything (typography-band/element.ts does the same).
export const SYS_BAR_TAG = 'sys-bar';

const PAGE_LOAD_EVENT = 'astro:page-load';

// Writes a text only when it changed (the engine notifies at 7fps).
const setText = (node: Element | null, text: string): void => {
  if (node === null || node.textContent === text) return;
  node.textContent = text;
};

const syncActiveNav = (root: HTMLElement): void => {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('nav a[href]')) {
    const active = isNavActive(location.pathname, link.getAttribute('href') ?? '');
    if (active) link.setAttribute('data-active', 'true');
    if (!active) link.removeAttribute('data-active');
  }
};

type MenuState = {
  tracker: TriggerTracker | undefined;
  loading: boolean;
  unmount: (() => void) | undefined;
};

export class SysBarElement extends HTMLElement {
  #disposers: (() => void)[] | undefined;
  #menu: MenuState = { tracker: undefined, loading: false, unmount: undefined };

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
    if (this.#disposers !== undefined) return; // already live: a persist move
    this.#disposers = [...this.#bindStatus(), ...this.#bindToggles(), this.#bindNav(), this.#bindMenu()];
  }

  #field(name: string): Element | null {
    return this.querySelector(`[data-status="${name}"]`);
  }

  #toggle(name: string): HTMLElement | null {
    return this.querySelector<HTMLElement>(`[data-toggle="${name}"]`);
  }

  #bindStatus(): (() => void)[] {
    const clock = () => setText(this.#field('clock'), getClock());
    const life = () => {
      const state = sharedLifeEngine.getState();
      setText(this.#field('gen'), genText(state.generation));
      setText(this.#field('alive'), aliveText(state.alive));
    };
    const watching = () => setText(this.#field('watching'), watchingText(getPresenceCount()));
    // Subscribe BEFORE the first read: the clock store fills the live time on subscribe.
    const disposers = [subscribeClock(clock), sharedLifeEngine.subscribe(life), subscribePresenceCount(watching)];
    clock();
    life();
    watching();
    return disposers;
  }

  #bindToggles(): (() => void)[] {
    const cursors = () => setText(this.#toggle('cursors'), cursorsText(isPresenceEnabled()));
    const motion = () => setText(this.#toggle('motion'), motionText(prefersReducedMotion()));
    const abort = new AbortController();
    this.#toggle('cursors')?.addEventListener('click', togglePresenceEnabled, { signal: abort.signal });
    this.#toggle('motion')?.addEventListener('click', toggleMotion, { signal: abort.signal });
    const disposers = [() => abort.abort(), subscribePresenceEnabled(cursors), subscribeReducedMotion(motion), bindMotionPlay()];
    cursors();
    motion();
    return disposers;
  }

  #bindNav(): () => void {
    const sync = () => syncActiveNav(this);
    sync();
    document.addEventListener(PAGE_LOAD_EVENT, sync);
    return () => document.removeEventListener(PAGE_LOAD_EVENT, sync);
  }

  #bindMenu(): () => void {
    const trigger = this.querySelector<HTMLElement>('[data-nav-menu] button');
    if (trigger !== null && this.#menu.unmount === undefined) {
      this.#menu.tracker = trackTrigger(trigger, () => this.#requestMenu());
    }
    return () => {
      this.#menu.tracker?.dispose();
      this.#menu.tracker = undefined;
      this.#menu.unmount?.();
      this.#menu.unmount = undefined;
    };
  }

  #requestMenu() {
    if (this.#menu.loading || this.#menu.unmount !== undefined) return;
    this.#menu.loading = true;
    void this.#loadMenu();
  }

  async #loadMenu() {
    try {
      const { mountNavMenu } = await import('./nav-menu/mount');
      const container = this.querySelector<HTMLElement>('[data-nav-menu]');
      const tracker = this.#menu.tracker;
      // Torn down while the chunk was in flight: stay static.
      if (container === null || tracker === undefined) return;
      const handoff = tracker.read();
      tracker.dispose();
      this.#menu.tracker = undefined;
      this.#menu.unmount = mountNavMenu({ container, handoff });
    } catch (error) {
      // The chunk failed (offline, a stale client after a redeploy): the static
      // trigger stays in place and the next intent retries.
      console.error(error);
    } finally {
      this.#menu.loading = false;
    }
  }

  #teardown() {
    for (const dispose of this.#disposers ?? []) dispose();
    this.#disposers = undefined;
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineSysBarElement = () => {
  if (customElements.get(SYS_BAR_TAG) !== undefined) return;
  customElements.define(SYS_BAR_TAG, SysBarElement);
};
