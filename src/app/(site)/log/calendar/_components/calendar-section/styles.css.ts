import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// 見出しは凡例とカレンダーの上に置く小さなラベル。h1（calendar）と同じ語を
// 繰り返さないよう、ここは「何のカレンダーか」を担う。
export const heading = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'wide',
  color: 'fg.muted',
});

// カレンダーは内容依存の固定幅（width: fit）。左寄せのまま罫線で囲って、
// 年表ページと同じ「枠に収まった記録」の見え方に揃える。
export const calendarRoot = css({
  alignSelf: 'flex-start',
  padding: 'block',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  bg: 'bg.canvas',
  overflowX: 'auto',
});
