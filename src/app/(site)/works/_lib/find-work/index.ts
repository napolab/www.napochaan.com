import type { WorkRow } from '../work-row';

// Find a work by its id. Returns undefined when no work matches (or the list is
// empty) — the caller decides whether that means a 404.
export const findWork = (works: readonly WorkRow[], id: string): WorkRow | undefined => works.find((work) => work.id === id);
