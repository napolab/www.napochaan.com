import { createBootStore } from './store';

// The one boot store every consumer without a provider shares: React islands (via the
// BootStatusContext default in ./index.tsx) and framework-free custom elements (e.g.
// <scramble-text>). Kept in a non-React module so vanilla code can import it without
// pulling React in. Safe at module scope — createBootStore only touches the DOM inside
// subscribe (client-only), so one MutationObserver on <html> serves the whole page.
export const defaultBootStore = createBootStore();
