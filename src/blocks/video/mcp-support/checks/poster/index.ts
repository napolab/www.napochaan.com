import { attrValue } from '../../shared';

import type { FenceCheckPlugin } from '..';

// poster 属性は variant=player の時のみ指定できることを検証する(値の書式は
// poster-format plugin の関心事)。
export const posterCheckPlugin: FenceCheckPlugin = {
  run({ fenceText, props, variant }) {
    return attrValue(props, 'poster') !== undefined && variant !== 'player'
      ? `video フェンスの poster は variant=player の時のみ指定できます(現在: ${variant ?? 'ambient(省略時のデフォルト)'})。ambient/player以外の値や省略時は無視されます。該当:\n${fenceText}`
      : undefined;
  },
};
