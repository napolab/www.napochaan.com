import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '4',
  flexWrap: 'wrap',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBlock: 'element',
});

export const nav = css({
  display: 'flex',
  gap: '[18px]',
  flexWrap: 'wrap',
});

export const navLink = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.default',
  textDecoration: 'none',
  paddingInline: '[6px]',
  _hover: {
    color: 'accent.text',
    textDecoration: 'underline',
  },
  '&[data-active]': {
    color: 'fg.onSolid',
    bg: 'fg.default',
  },
});

export const status = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const gen = css({
  color: 'accent.text',
});

export const rec = css({
  color: 'danger.text',
});

export const checker = css({
  height: '[16px]',
  marginBlock: 'element',
  backgroundImage: '[conic-gradient(token(colors.fg.default) 25%, transparent 0 50%, token(colors.fg.default) 0 75%, transparent 0)]',
  backgroundSize: '[16px 16px]',
});
