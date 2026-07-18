import type { FenceCheckPlugin } from '..';

const isValidVariant = (value: string): boolean => value === 'ambient' || value === 'player';

// variant 属性(省略可)が ambient/player のいずれかであることを検証する。
export const variantCheckPlugin: FenceCheckPlugin = {
  run({ fenceText, variant }) {
    return variant !== undefined && !isValidVariant(variant) ? `video フェンスの variant は ambient か player のいずれかである必要があります(不正な値: ${variant})。該当:\n${fenceText}` : undefined;
  },
};
