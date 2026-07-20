import { none, some } from '@utils/option';

import type { Option } from '@utils/option';

// value とその Error.cause チェーンを先頭から辿り、述語にマッチする最初の値を some で返す。
// マッチが無ければ none。Error でない値、または cause 途切れで停止する(Error.cause は
// acyclic 前提 — 通常のコードが循環参照を作ることはない)。
export const findCause = <T>(value: unknown, predicate: (candidate: unknown) => candidate is T): Option<T> => {
  if (predicate(value)) return some(value);
  if (value instanceof Error) return findCause(value.cause, predicate);

  return none;
};
