import { css } from '@styled/css';

export const root = css({
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'fg.default',
  paddingBlock: 'element',
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'inline',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const status = css({
  display: 'flex',
  gap: 'inline',
});

export const live = css({
  color: 'accent.text',
});
