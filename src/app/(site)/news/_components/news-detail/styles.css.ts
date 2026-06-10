import { css } from '@styled/css';

// Short announcements get a minimum body height so the header and prev/next nav
// don't bunch at the top of the page.
// No weight override: the RichText body inherits the global body weight so the
// prose matches /about (which renders bio/philosophy through the same RichText).
export const body = css({
  minHeight: '[40vh]',
});
