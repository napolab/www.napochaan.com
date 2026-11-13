import { css } from '@styled/css';

// FeedLink と同じ mono テキスト系トーン。metaRow で横に並ぶ前提。
export const trigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'fg.muted',
  cursor: 'pointer',
  '&[data-hovered]': {
    color: 'accent.text',
  },
});

// Floating surface — sys-bar / quote-share の popover トークンに合わせる。
export const popover = css({
  bg: 'bg.canvas',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

export const dialog = css({
  padding: '3',
  outline: 'none',
});
