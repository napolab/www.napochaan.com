import { css } from '@styled/css';

export const root = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
});

export const list = css({
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  listStyle: 'none',
  m: '0',
  p: '0',
});

export const item = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'fg.muted',
  // Prefix crumbs (home / works) keep their natural width so the whole row
  // never wraps; only the last crumb is allowed to shrink (see data-last).
  flexShrink: 0,
  '&[data-first="false"]': {
    _before: {
      content: '"/"',
      mx: 'inline',
      color: 'fg.subtle',
    },
  },
  // The last crumb is the page title; let it shrink within the row so its
  // text can ellipsize on one line instead of wrapping.
  '&[data-last="true"]': {
    minWidth: '0',
    flexShrink: 1,
  },
});

export const current = css({
  color: 'fg.default',
  fontWeight: 'medium',
  display: 'block',
  minWidth: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
