import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const list = css({
  display: 'flex',
  flexDirection: 'column',
});

export const post = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  paddingBlock: 'block',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': { borderBottomWidth: 'none' },
});

export const index = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'accent.text',
});

// Title link in the inline link colour (accent.text). The scramble is the only
// hover affordance — no background fill. Hug the text (start-aligned, capped at
// the container width so long titles still wrap) and reserve the focus ring.
export const title = css({
  alignSelf: 'start',
  maxWidth: 'full',
  fontFamily: 'body',
  fontWeight: 'medium',
  fontSize: 'lg',
  lineHeight: 'snug',
});

export const meta = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'inline',
});

export const excerpt = css({
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'jp',
  color: 'fg.muted',
});
