import { createLifeEngine, type LifeEngine } from './engine';

// `density: 0` keeps the placeholder engine deterministic: it seeds NO live cells
// instead of calling Math.random at construction. The SysBar renders this engine's
// state during SSR (gen 0000 / alive 0) — a random seed would make the server markup
// differ between renders (and, for a hydrated React twin, fail hydration). The real
// grid is seeded later, client-side, when the canvas measures its box and calls
// engine.resize (which always uses RESEED_DENSITY).
const PLACEHOLDER = { cols: 1, rows: 1, density: 0 } as const;

export const createPlaceholderLifeEngine = (): LifeEngine => createLifeEngine(PLACEHOLDER);

// Module-level engine shared by the page background and the SysBar. Framework-free so
// the <game-of-life> element (ticks it) and the <sys-bar> element (reads gen / alive)
// meet here without React; the React twins (./provider) default to it too. It is only
// mutated client-side (resize / tick), so the copy that lives in the server isolate
// stays the deterministic empty placeholder.
export const sharedLifeEngine = createPlaceholderLifeEngine();
