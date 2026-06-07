import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const who = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  padding: 'block',
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  color: 'fg.default',
  backgroundColor: 'bg.subtle',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const prompt = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'accent.text',
});

export const row = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 'inline',
});

export const key = css({
  flex: 'none',
  width: '[7ch]',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.muted',
});

export const value = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.default',
});
