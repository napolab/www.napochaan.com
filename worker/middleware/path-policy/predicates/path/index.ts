import { allOf, anyOf, equals, not } from '../../../../lib/predicate';

import type { Predicate } from '../../../../lib/predicate';

const startsWith =
  (prefix: string): Predicate<string> =>
  (pathname) =>
    pathname.startsWith(prefix);

export const isExactPath = (path: string): Predicate<string> => equals(path);

// 完全一致か `<path>/` 始まりだけ(`/administrator` は対象外)。
export const isWithinPath = (path: string): Predicate<string> => anyOf(isExactPath(path), startsWith(`${path}/`));

// `<path>/` より深いパスだけ。`<path>` と `<path>/` 自身は含まない。
export const isDescendantOf = (path: string): Predicate<string> => allOf(startsWith(`${path}/`), not(isExactPath(`${path}/`)));
