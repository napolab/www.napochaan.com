import type { WorkRow } from '../work-row';

// Works sharing `work`'s type, excluding `work` itself, capped at `limit`.
// Pure: filters then slices, preserving the input order. Returns fewer than
// `limit` (possibly empty) when not enough siblings exist.
export const relatedWorks = (works: readonly WorkRow[], work: WorkRow, limit = 3): WorkRow[] => works.filter((candidate) => candidate.type === work.type && candidate.id !== work.id).slice(0, limit);
