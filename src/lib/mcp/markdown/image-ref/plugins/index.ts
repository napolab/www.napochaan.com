import { err } from 'neverthrow';

import type { ImageRef } from '..';
import type { Result } from 'neverthrow';

// family classification プラグインの契約。raw(1 トークン全体)を受け取り、自 family に
// マッチすれば ok(ImageRef)、マッチしなければ err(raw) を返す(prefix-match-processor 形式)。
export interface ImageRefPlugin {
  run(raw: string): Result<ImageRef, string>;
}

// raw(1 トークン全体)から `![alt](target)` の alt/target を取り出す共通 regex。
// トークンは既に IMAGE_REF_TOKEN でマッチ済みの文字列そのものなので `^...$` で全体に効かせる。
// media-file / external の両プラグインが共有する。
export const REF_PARTS = /^!\[([^\]]*)\]\(([^)]*)\)$/;

// plugins を先頭から順に試し、最初に ok を返したものを採用する first-match runner。
// 全滅した場合(または plugins が空)は err(raw) を返す。
export const runPlugins = (raw: string, plugins: readonly ImageRefPlugin[]): Result<ImageRef, string> => {
  const [head, ...tail] = plugins;
  if (head === undefined) return err(raw);
  const result = head.run(raw);
  if (result.isOk()) return result;
  return runPlugins(raw, tail);
};
