// error とその Error.cause チェーンを先頭から辿り、述語にマッチする最初の値を返す。
// マッチが無ければ undefined。Error でない値、または cause 途切れで停止する(Error.cause は
// acyclic 前提 — 通常のコードが循環参照を作ることはない)。
export const findCause = <T>(value: unknown, predicate: (candidate: unknown) => candidate is T): T | undefined => {
  if (predicate(value)) return value;
  if (value instanceof Error) return findCause(value.cause, predicate);

  return undefined;
};
