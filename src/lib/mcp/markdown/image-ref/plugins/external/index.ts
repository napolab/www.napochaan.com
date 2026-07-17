import { ok } from 'neverthrow';

import { REF_PARTS } from '..';

import type { ImageRefPlugin } from '..';

// 常に ok を返す終端プラグイン(placeholder / mediaFile どちらにも分類できない残り全部)。
// prefix-match-processor の runner は first-match なので、これを最後に置くことで
// classifyImageRef が非マッチで終わることはない(トークン検出済みの raw が前提)。
export const externalPlugin: ImageRefPlugin = {
  run(raw) {
    const match = REF_PARTS.exec(raw);
    const alt = match?.[1] ?? '';
    const target = match?.[2] ?? '';
    return ok({ kind: 'external', target, alt });
  },
};
