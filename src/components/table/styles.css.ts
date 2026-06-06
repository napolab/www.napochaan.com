import { css } from '@styled/css';

// Desktop: a normal bordered table. Mobile (< desktop): each row becomes a
// bordered card and every cell shows its column label via ::before (data-label),
// so the 4-column table never overflows a narrow screen.
export const root = css({
  width: 'full',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
  display: { base: 'block', desktop: 'table' },
  borderCollapse: 'collapse',
  borderWidth: { base: 'none', desktop: 'default' },
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

export const caption = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
  textAlign: 'left',
  py: '2',
  captionSide: 'bottom',
});

export const head = css({
  display: { base: 'none', desktop: 'table-header-group' },
});

export const body = css({
  display: { base: 'block', desktop: 'table-row-group' },
});

export const headerCell = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontWeight: 'semibold',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
  textAlign: 'left',
  px: 'element',
  py: '2',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  bg: 'bg.subtle',
});

export const row = css({
  display: { base: 'block', desktop: 'table-row' },
  borderWidth: { base: 'default', desktop: 'none' },
  borderStyle: 'solid',
  borderColor: 'fg.default',
  marginBottom: { base: 'element', desktop: '0' },
  transitionProperty: '[background-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    bg: 'bg.subtle',
  },
  '&:last-child': {
    marginBottom: '0',
  },
  desktop: {
    borderBottomWidth: 'hairline',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border.subtle',
    '&:last-child': {
      borderBottomWidth: 'none',
    },
  },
});

export const cell = css({
  display: { base: 'flex', desktop: 'table-cell' },
  justifyContent: { base: 'space-between', desktop: 'normal' },
  gap: 'inline',
  px: 'element',
  py: '2',
  color: 'fg.default',
  verticalAlign: 'top',
  borderBottomWidth: { base: 'hairline', desktop: 'none' },
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': {
    borderBottomWidth: 'none',
  },
  _before: {
    content: '[attr(data-label)]',
    display: { base: 'inline', desktop: 'none' },
    fontFamily: 'mono',
    fontSize: 'xs',
    letterSpacing: 'wide',
    textTransform: 'uppercase',
    color: 'fg.muted',
  },
});
