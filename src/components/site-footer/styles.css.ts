import { css } from '@styled/css';

export const root = css({
  // The footer is a sibling of the page <main> in the shell's normal flow with
  // no gap between them, so without this its top border would hug the last
  // section on every page. Separate it on the section rhythm.
  marginBlockStart: { base: '8', desktop: 'section' },
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

export const colophon = css({
  color: 'fg.muted',
  textDecorationLine: 'none',
  _hover: { color: 'accent.text', textDecorationLine: 'underline', textUnderlineOffset: '[2px]' },
  _focusVisible: { layerStyle: 'focusRing' },
});
