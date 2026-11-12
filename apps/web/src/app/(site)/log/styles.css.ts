import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  // Fill the shell's flex column so the footer pins to the bottom of the fold on
  // short pages (see site-shell `stage`). Inert once content exceeds the viewport.
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});

export const errorSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 'element',
});

// feed リンクとカレンダートリガーの横並び行。FeedLink は自前の marginTop -4 を
// 持っているので、calendarSlot が同じオフセットを鏡写しにして 1 行に揃える。
export const metaRow = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '3',
});

export const calendarSlot = css({
  display: 'flex',
  alignItems: 'center',
  marginTop: '-4',
});
