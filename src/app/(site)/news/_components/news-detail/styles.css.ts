import { css } from '@styled/css';

// Short announcements grow to absorb the slack in the shell's filled column, so
// the prev/next nav and footer settle at the bottom of the fold instead of
// bunching under the header. The grow resolves to 0 once the body overflows the
// viewport, so long announcements are unaffected.
// No weight override: the RichText body inherits the global body weight so the
// prose matches /about (which renders bio/philosophy through the same RichText).
export const body = css({
  flexGrow: 1,
});
