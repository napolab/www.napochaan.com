// `next build` has no CMS service binding, so the adapters return empty data
// while prerendering; pages fill in at runtime. Removed once CMS pages are
// force-dynamic.
export const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';
