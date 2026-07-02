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

export const headerRoot = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
  marginBottom: '2',
});

export const heading = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
});

export const navButton = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  paddingX: '2',
  color: 'fg.muted',
  cursor: 'pointer',
  '&[data-hovered]': {
    color: 'accent.text',
  },
  '&[data-disabled]': {
    opacity: '[0.35]',
    cursor: 'default',
  },
});

export const headerCell = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontWeight: 'normal',
  color: 'fg.muted',
  paddingBottom: '1',
});

// セル下端のドットは ::after で描く（装飾グリフは CSS で描く — JSX に直書きしない）。
// timeline の記号系を踏襲: 塗り(accent) = upcoming、muted ドット = 過去エントリ。
export const cell = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8',
  height: '8',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.default',
  '&[data-outside-month]': {
    visibility: 'hidden',
  },
  '&[data-disabled]': {
    color: 'fg.muted',
  },
  _after: {
    content: '""',
    position: 'absolute',
    bottom: '[3px]',
    left: '[calc(50% - 2px)]',
    width: '[4px]',
    height: '[4px]',
    borderRadius: 'full',
    bg: 'transparent',
  },
  '&[data-mark="past"]': {
    _after: {
      bg: 'fg.muted',
    },
  },
  '&[data-mark="upcoming"]': {
    _after: {
      bg: 'accent.solid',
    },
  },
});
