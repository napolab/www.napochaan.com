import { err, ok } from 'neverthrow';

import type { ImageRefPlugin } from '..';

const PLACEHOLDER_TOKEN = /^!\[media:(\d+)\]\(([^)]*)\)$/;

// alt に ')' は書けない(regex 上 [^)]* — 括弧を含む alt は表現できない制約。既存 3 モジュール共通の不変条件)。
// media-placeholders 由来: id 部分は `\d+` 必須(桁以外混入・空 id は非マッチ)。
// 表記保持のため rawID(capture そのもの)を id と別に持つ — `![media:007]` を
// parsed id 経由で再構築すると `![media:7]` に化けてしまう regression を防ぐ。
export const placeholderPlugin: ImageRefPlugin = {
  run(raw) {
    const match = PLACEHOLDER_TOKEN.exec(raw);
    if (match === null) return err(raw);
    const [, rawID, alt] = match;
    if (rawID === undefined || alt === undefined) return err(raw);
    return ok({ kind: 'placeholder', id: parseInt(rawID, 10), rawID, alt });
  },
};
