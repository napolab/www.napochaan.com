import { err } from 'neverthrow';

import type { ImageRef } from '..';
import type { Result } from 'neverthrow';

// prefix-match-processor の汎用 plugin 契約。In を受け取り、自 family にマッチすれば
// ok(Out)、マッチしなければ err(In) を返す。image-ref の family classification
// (ImageRefPlugin)と tools/raw-ref-hints の hint plugin の両方がこれを実装し、
// runPlugins という単一の first-match runner を共有する(family/用途ごとに
// runner を再実装しない — skill が要求する「runner は 1 つ」の原則)。
export interface Plugin<In, Out> {
  run(input: In): Result<Out, In>;
}

// family classification プラグインの契約。raw(1 トークン全体)を受け取り、自 family に
// マッチすれば ok(ImageRef)、マッチしなければ err(raw) を返す(prefix-match-processor 形式)。
export type ImageRefPlugin = Plugin<string, ImageRef>;

// raw(1 トークン全体)から `![alt](target)` の alt/target を取り出す共通 regex。
// トークンは既に IMAGE_REF_TOKEN でマッチ済みの文字列そのものなので `^...$` で全体に効かせる。
// media-file / external の両プラグインが共有する。
export const REF_PARTS = /^!\[([^\]]*)\]\(([^)]*)\)$/;

// plugins を先頭から順に試し、最初に ok を返したものを採用する first-match runner。
// 全滅した場合(または plugins が空)は err(input) を返す。In/Out を型引数化し、
// ImageRefPlugin(string -> ImageRef)と hint plugin(ImageNode -> string)の
// どちらでも同じ実装を共有できるようにする。
export const runPlugins = <In, Out>(input: In, plugins: readonly Plugin<In, Out>[]): Result<Out, In> => {
  const [head, ...tail] = plugins;
  if (head === undefined) return err(input);
  const result = head.run(input);
  if (result.isOk()) return result;
  return runPlugins(input, tail);
};
