import { POSTER_REF } from '../../../fence';
import { attrValue } from '../../shared';

import type { FenceCheckPlugin } from '..';

// poster 属性が指定されている場合、値が media:<id> の形式であることを検証する。
export const posterFormatCheckPlugin: FenceCheckPlugin = {
  run({ fenceText, props }) {
    const raw = attrValue(props, 'poster');
    if (raw === undefined) return undefined;

    return POSTER_REF.test(raw) ? undefined : `video フェンスの poster は media:<id> の形式である必要があります(不正な値: ${raw})。該当:\n${fenceText}`;
  },
};
