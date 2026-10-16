import { css } from '@styled/css';

// feed リンクとカレンダー導線の横並び行。FeedLink は自前の marginTop -4 を
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
