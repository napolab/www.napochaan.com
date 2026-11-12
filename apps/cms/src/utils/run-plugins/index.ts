import { err } from 'neverthrow';

import type { Result } from 'neverthrow';

// prefix-match-processor の汎用 plugin 契約。In を受け取り、自 family にマッチすれば
// ok(Out)、マッチしなければ err(In) を返す(null/boolean/throw は禁止 — runner が
// Result で連鎖するため)。image-ref の family classification(ImageRefPlugin)、
// tools/raw-ref-hints の hint plugin、link-embed の LinkEmbedProvider がこれを実装し、
// runPlugins という単一の first-match runner を共有する(family/用途ごとに
// runner を再実装しない — skill が要求する「runner は 1 つ」の原則)。
export interface Plugin<In, Out> {
  run(input: In): Result<Out, In>;
}

// plugins を先頭から順に試し、最初に ok を返したものを採用する first-match runner。
// 全滅した場合(または plugins が空)は err(input) を返す。順序が優先度 —
// より具体的な family の plugin を先に登録すること(broad が先だと specific を隠す)。
export const runPlugins = <In, Out>(input: In, plugins: readonly Plugin<In, Out>[]): Result<Out, In> => {
  const [head, ...tail] = plugins;
  if (head === undefined) return err(input);
  const result = head.run(input);
  if (result.isOk()) return result;
  return runPlugins(input, tail);
};
