import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
  m: '0',
  p: '0',
});

export const item = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: 'inline',
  py: '2',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'body',
  color: 'fg.default',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': {
    borderBottomWidth: 'none',
  },
  '&[data-ordered="false"]': {
    _before: {
      content: '"▸"',
      color: 'accent.solid',
      fontFamily: 'mono',
      fontSize: 'xs',
      flexShrink: '0',
    },
  },
  '&[data-ordered="true"]': {
    _before: {
      content: 'counter(list-item, decimal-leading-zero) "."',
      counterIncrement: 'list-item',
      color: 'accent.solid',
      fontFamily: 'mono',
      fontSize: 'xs',
      flexShrink: '0',
    },
  },
});

export const term = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  letterSpacing: 'wide',
  py: '2',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
});

export const description = css({
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'body',
  color: 'fg.default',
  m: '0',
  py: '2',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
});

export const descriptionList = css({
  display: 'grid',
  gridTemplateColumns: '[auto 1fr]',
  columnGap: 'block',
  m: '0',
  p: '0',
});
