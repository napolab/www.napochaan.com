import { fromThrowable } from 'neverthrow';

// 本文 Markdown 中のサイト内 media 直リンク(/api/media/file/<filename>)を検出・置換する
// 純粋関数群。get_post の read 正規化(raw 形 → ![media:<id>]())と、write 検証エラーの
// 置き換え先提示(対応する media id の逆引き)に使う。
// 外部 URL やプレースホルダ・image-row セル構文はここでは一切触らない。

export type MediaFileRef = { ref: string; filename: string };

// ![alt](非空) の画像参照。![media:<id>]() は括弧が空なのでマッチしない。
const IMAGE_REF = /!\[[^\]]*\]\(([^)]+)\)/g;

const MEDIA_FILE_PATH_PREFIX = '/api/media/file/';

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
const filenameOf = (rawTarget: string): string | undefined => {
  const [target] = rawTarget.trim().split(/\s+/); // markdown title("...")を落とす
  if (target === undefined || target === '') return undefined;
  const pathname = pathnameOf(target);
  if (pathname === undefined) return undefined;
  if (!pathname.startsWith(MEDIA_FILE_PATH_PREFIX)) return undefined;
  const encoded = pathname.slice(MEDIA_FILE_PATH_PREFIX.length);
  if (encoded === '' || encoded.includes('/')) return undefined;
  return decodeFilename(encoded).unwrapOr(undefined);
};

export const findMediaFileRefs = (markdown: string): MediaFileRef[] =>
  [...markdown.matchAll(IMAGE_REF)].flatMap((match) => {
    const filename = filenameOf(match[1] ?? '');
    return filename === undefined ? [] : [{ ref: match[0], filename }];
  });

export const rewriteMediaFileRefs = (markdown: string, idByFilename: ReadonlyMap<string, number>): string =>
  markdown.replace(IMAGE_REF, (ref, target: string) => {
    const filename = filenameOf(target);
    if (filename === undefined) return ref;
    const id = idByFilename.get(filename);
    return id === undefined ? ref : `![media:${id}]()`;
  });
