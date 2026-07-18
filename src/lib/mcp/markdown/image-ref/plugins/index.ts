import type { ImageRef } from '..';
import type { Plugin } from '@utils/run-plugins';

// prefix-match-processor の汎用 plugin 契約と first-match runner(runPlugins)は
// @utils/run-plugins に一元化されている(link-embed / raw-ref-hints とも共有)。
// このモジュールは image-ref family classification 固有の型と共有 regex だけを持つ。

// family classification プラグインの契約。raw(1 トークン全体)を受け取り、自 family に
// マッチすれば ok(ImageRef)、マッチしなければ err(raw) を返す(prefix-match-processor 形式)。
export type ImageRefPlugin = Plugin<string, ImageRef>;

// raw(1 トークン全体)から `![alt](target)` の alt/target を取り出す共通 regex。
// トークンは既に IMAGE_REF_TOKEN でマッチ済みの文字列そのものなので `^...$` で全体に効かせる。
// media-file / external の両プラグインが共有する。
export const REF_PARTS = /^!\[([^\]]*)\]\(([^)]*)\)$/;
