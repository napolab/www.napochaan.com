import type { LogEntry } from '../../log/_lib/build-log-timeline';

// The home teaser surfaces "what's next": upcoming gigs lead in chronological
// (nearest-first) order, and any leftover slots are filled with the most recent
// finished entries. The input is the full timeline flattened in date-descending
// order (buildLogTimeline's output), so upcoming entries are reversed to ascend
// toward the soonest gig while finished entries keep their newest-first order. Pure.
export const selectHomeLogTeaser = (entries: readonly LogEntry[], limit: number): LogEntry[] => {
  const upcomingNearestFirst = entries.filter((entry) => entry.upcoming).toReversed();
  const finishedRecentFirst = entries.filter((entry) => !entry.upcoming);

  return [...upcomingNearestFirst, ...finishedRecentFirst].slice(0, limit);
};
