import { err, fromThrowable, ok } from 'neverthrow';

import { REF_PARTS } from '..';

import type { ImageRefPlugin } from '..';

export const DEFAULT_MEDIA_FILE_PATH_PREFIX = '/api/media/file/';

const decodeFilename = fromThrowable(
  (encoded: string) => decodeURIComponent(encoded),
  () => undefined,
);

// 相対・絶対どちらの URL 形式も base 付き URL パースで pathname に正規化する。
// query/hash やホスト差(本番/staging/localhost)を吸収し、path 規約だけで判定する。
const pathnameOf = (target: string): string | undefined => {
  if (!URL.canParse(target, 'http://relative.invalid')) return undefined;
  return new URL(target, 'http://relative.invalid').pathname;
};

// 括弧内テキストから media filename を取り出す。media 直リンクでなければ undefined。
const filenameOf = (rawTarget: string, pathPrefix: string): string | undefined => {
  const [target] = rawTarget.trim().split(/\s+/); // markdown title("...")を落とす
  if (target === undefined || target === '') return undefined;
  const pathname = pathnameOf(target);
  if (pathname === undefined) return undefined;
  if (!pathname.startsWith(pathPrefix)) return undefined;
  const encoded = pathname.slice(pathPrefix.length);
  if (encoded === '' || encoded.includes('/')) return undefined;
  return decodeFilename(encoded).unwrapOr(undefined);
};

// media-file-refs 由来: サイト内 media 直リンク(pathPrefix 配下)の検出。
// 相対・絶対 URL どちらも許容、query/hash・ホスト差は無視、nested path・malformed
// percent-encoding は非マッチ(throw させない)。pathPrefix は利用時注入(review L46:
// モジュール定数のハードコードをやめ、呼び出し側が prefix を選べるようにする)。
export const createMediaFilePlugin = (pathPrefix: string): ImageRefPlugin => ({
  run(raw) {
    const match = REF_PARTS.exec(raw);
    if (match === null) return err(raw);
    const [, alt, target] = match;
    if (alt === undefined || target === undefined) return err(raw);
    const filename = filenameOf(target, pathPrefix);
    if (filename === undefined) return err(raw);
    return ok({ kind: 'mediaFile', filename, alt });
  },
});
