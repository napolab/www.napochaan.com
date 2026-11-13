import type { Profile } from '../../profile';

type WhoamiRow = { term: string; description: string };

// The `01 whoami` definition rows, in display order. Pure.
export const buildWhoamiRows = (profile: Profile): WhoamiRow[] => [
  { term: 'name', description: profile.name },
  { term: 'aka', description: profile.aka },
  { term: 'now', description: profile.now },
  { term: 'team', description: profile.team },
];
