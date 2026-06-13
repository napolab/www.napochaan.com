import type { WorkRow } from '../work-row';

// Find a work by its slug. Returns undefined when no work matches (or the list is
// empty) — the caller decides whether that means a 404.
export const findWork = (works: readonly WorkRow[], slug: string): WorkRow | undefined => works.find((work) => work.slug === slug);
