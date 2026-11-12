import { css } from '@styled/css';

// 標準の in-body figure と揃えるため 85% の中央寄せ + 上下マージンを共有する
// (converters/upload・converters/image-row と同じ寸法)。
export const root = css({
  display: 'block',
  width: '[85%]',
  marginInline: '[auto]',
  marginBlock: '8',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

// iframe を包む 16:9 の枠。iframe は position:absolute で inset:0 に展開する。
export const frame = css({
  position: 'relative',
  width: 'full',
  aspectRatio: '[16 / 9]',
  display: 'block',
  bg: 'bg.subtle',
  overflow: 'hidden',
});

export const iframe = css({
  position: 'absolute',
  inset: '0',
  width: 'full',
  height: 'full',
  border: 'none',
  display: 'block',
});

// figcaption は Figure の plain variant と同じルック(mono / muted / hairline separator)。
export const caption = css({
  display: 'block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  px: 'element',
  py: '2',
  borderTopWidth: 'hairline',
  borderTopStyle: 'dashed',
  borderTopColor: 'border.subtle',
});
