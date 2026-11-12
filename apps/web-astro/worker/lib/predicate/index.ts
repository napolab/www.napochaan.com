export type Predicate<I> = (input: I) => boolean;

export const allOf =
  <I>(...predicates: readonly Predicate<I>[]): Predicate<I> =>
  (input) =>
    predicates.every((predicate) => predicate(input));

export const anyOf =
  <I>(...predicates: readonly Predicate<I>[]): Predicate<I> =>
  (input) =>
    predicates.some((predicate) => predicate(input));

export const not =
  <I>(predicate: Predicate<I>): Predicate<I> =>
  (input) =>
    !predicate(input);

// 入力の一部分(select の結果)に対する predicate を、入力全体に対する predicate へ持ち上げる。
export const on =
  <I, K>(select: (input: I) => K, predicate: Predicate<K>): Predicate<I> =>
  (input) =>
    predicate(select(input));

export const equals =
  <T>(expected: T): Predicate<T> =>
  (value) =>
    value === expected;

export const isIn =
  <T>(values: readonly T[]): Predicate<T> =>
  (value) =>
    values.includes(value);
