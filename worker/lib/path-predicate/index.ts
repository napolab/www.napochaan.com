import { allOf, anyOf, equals, not } from '../predicate';

import type { Predicate } from '../predicate';

// 汎用の文字列 path 述語。pathname はそのまま比較する(percent-decode は呼び出し側の責務)。
export const hasPrefix =
  (prefix: string): Predicate<string> =>
  (pathname) =>
    pathname.startsWith(prefix);

export const hasSuffix =
  (suffix: string): Predicate<string> =>
  (pathname) =>
    pathname.endsWith(suffix);

export const isExactPath = (path: string): Predicate<string> => equals(path);

// 完全一致か `<path>/` 始まりだけ(`/administrator` は対象外)。
export const isWithinPath = (path: string): Predicate<string> => anyOf(isExactPath(path), hasPrefix(`${path}/`));

// `<path>/` より深いパスだけ。`<path>` と `<path>/` 自身は含まない。
export const isDescendantOf = (path: string): Predicate<string> => allOf(hasPrefix(`${path}/`), not(isExactPath(`${path}/`)));
