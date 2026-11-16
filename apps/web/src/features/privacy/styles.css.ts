import { css } from '@styled/css';

// One column, like the colophon: PageHeader, then the numbered sections.
export const main = css({
  display: 'flex',
  flexDirection: 'column',
  // Fill the shell's flex column so the footer pins to the bottom of the fold on
  // short pages (see site-shell `stage`). Inert once content exceeds the viewport.
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});

export const cell = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Body copy. Same measure as the colophon intro (fixed rem so it stays aligned at
// every font size); line-break:strict applies Japanese kinsoku.
export const paragraph = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'body',
  color: 'fg.default',
  maxWidth: '[40rem]',
  lineBreak: 'strict',
});

// What the contact form collects: short items, so a plain bulleted column.
export const list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  margin: '0',
  paddingInlineStart: 'block',
  fontFamily: 'body',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'body',
  color: 'fg.default',
  listStyleType: 'square',
});

// The services table answers to its own width: a real table once three columns fit,
// a stack of one card per service below that (no horizontal page scroll).
const WIDE = '@container (min-width: 40rem)';

export const tableRoot = css({
  containerType: 'inline-size',
});

export const table = css({
  display: 'block',
  width: 'full',
  borderCollapse: 'collapse',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'body',
  color: 'fg.default',
  [WIDE]: { display: 'table' },
});

// The section's lead sentence doubles as the table caption.
export const caption = css({
  display: 'block',
  marginBottom: 'block',
  fontFamily: 'body',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'body',
  textAlign: 'start',
  color: 'fg.default',
  lineBreak: 'strict',
  [WIDE]: { display: 'table-caption' },
});

// Narrow: the column headers stay in the accessibility tree but leave the layout;
// each card labels its cells through data-label instead. The markup carries explicit
// table roles, since display:block/flex would otherwise strip the implicit ones.
export const head = css({
  srOnly: true,
  [WIDE]: { srOnly: false, display: 'table-header-group' },
});

export const body = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  [WIDE]: { display: 'table-row-group' },
});

export const row = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  padding: 'element',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  [WIDE]: {
    display: 'table-row',
    padding: '0',
    borderWidth: 'none',
    borderBottomWidth: 'hairline',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border.subtle',
  },
});

export const columnHeader = css({
  paddingInline: 'element',
  paddingBlock: 'inline',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textAlign: 'start',
  // fg.muted (≥4.5:1 vs canvas); fg.subtle fails AA at this size.
  color: 'fg.muted',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
});

// The service name: the card title when stacked, the row header in the table.
export const rowHeader = css({
  display: 'block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  textAlign: 'start',
  color: 'fg.default',
  [WIDE]: { display: 'table-cell', paddingInline: 'element', paddingBlock: 'element', verticalAlign: 'top', whiteSpace: 'nowrap' },
});

export const dataCell = css({
  display: 'flex',
  flexDirection: 'column',
  lineBreak: 'strict',
  _before: {
    content: '[attr(data-label)]',
    fontFamily: 'mono',
    fontVariationSettings: '"wght" 600',
    fontSize: 'xs',
    letterSpacing: 'wide',
    color: 'fg.muted',
  },
  [WIDE]: {
    display: 'table-cell',
    paddingInline: 'element',
    paddingBlock: 'element',
    verticalAlign: 'top',
    _before: { display: 'none' },
  },
});

export const updated = css({
  margin: '0',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'fg.muted',
});
