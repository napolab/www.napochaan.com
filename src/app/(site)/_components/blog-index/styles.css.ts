import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  paddingBlock: 'section',
  paddingInline: 'page',
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

export const title = css({
  fontFamily: 'display',
  fontSize: 'lg',
  lineHeight: 'snug',
  color: 'fg.default',
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
