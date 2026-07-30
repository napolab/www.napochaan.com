import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'block',
});

export const item = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'inline',
});

export const term = css({
  display: 'flex',
  alignItems: 'center',
});

// Calendar のセル ::after と同じ寸法・同じトークンの見本。
export const dot = css({
  display: 'block',
  width: '[6px]',
  height: '[6px]',
  borderRadius: 'full',
  bg: 'transparent',
  '&[data-tone="default"]': {
    bg: 'fg.muted',
  },
  '&[data-tone="accent"]': {
    bg: 'accent.solid',
  },
});

export const description = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'fg.muted',
});
