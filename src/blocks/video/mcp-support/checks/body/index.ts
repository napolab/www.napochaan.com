import { bodyMediaIDOf } from '../../shared';

import type { FenceCheckPlugin } from '..';

// body(フェンス内テキスト)がちょうど1行の有効な media 行であることを検証する。
export const bodyCheckPlugin: FenceCheckPlugin = {
  run({ fenceText, body }) {
    return bodyMediaIDOf(body) === undefined
      ? `video フェンスは ![media:<id>](caption) をちょうど1行含む必要があります(動画1本固定)。caption は省略可(![media:<id>]())。該当:\n${fenceText}`
      : undefined;
  },
};
