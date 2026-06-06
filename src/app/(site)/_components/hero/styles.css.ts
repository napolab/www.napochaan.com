import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  paddingBlock: 'section',
  paddingInline: 'page',
});

export const kicker = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const lead = css({
  fontFamily: 'body',
  fontSize: 'lg',
  lineHeight: 'jp',
  color: 'fg.default',
  maxWidth: '[54ch]',
});

export const annotationStart = css({
  position: 'absolute',
  top: 'section',
  right: 'page',
});

export const annotationEnd = css({
  position: 'absolute',
  bottom: 'section',
  right: 'page',
});
