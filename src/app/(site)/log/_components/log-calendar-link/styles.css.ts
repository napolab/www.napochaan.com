import { css } from '@styled/css';

// FeedLink と同じ mono テキスト系トーン。metaRow で横に並ぶ前提。
export const link = css({
  display: 'inline-flex',
  alignItems: 'center',
  '&[data-hovered]': {
    color: 'accent.text',
  },
});
