import { css } from '@styled/css';

export const layer = css({
  position: 'fixed',
  inset: '0',
  pointerEvents: 'none',
  zIndex: 'overlay',
  overflow: 'hidden',
});

export const cursor = css({
  position: 'absolute',
  top: '0',
  left: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '[2px]',
  fontFamily: 'mono',
  fontSize: 'xs',
  whiteSpace: 'nowrap',
  transition: '[translate 100ms linear]',
  '@media (prefers-reduced-motion: reduce)': {
    transition: '[none]',
  },
});

export const glyph = css({ fontSize: '[16px]', fontWeight: 'bold', lineHeight: 'none', color: 'var(--cursor-color)' });

export const label = css({
  paddingInline: '[4px]',
  color: 'white',
  background: 'var(--cursor-color)',
});

export const more = css({
  position: 'absolute',
  right: 'element',
  bottom: 'element',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});
