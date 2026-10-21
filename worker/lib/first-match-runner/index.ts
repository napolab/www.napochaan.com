import { err, ok } from 'neverthrow';

import type { Predicate } from '../predicate';
import type { Result } from 'neverthrow';

// 非マッチは必ず `err(input)` を返す。runner は先頭から順に試し、最初の ok を採る。
export type Plugin<I, T> = { run: (input: I) => Result<T, I> };

// predicate が成り立つ時だけ toValue の結果で match する plugin。非マッチの `err(input)` 契約はここに閉じ込める。
export const when = <I, T>(predicate: Predicate<I>, toValue: (input: I) => T): Plugin<I, T> => ({
  run: (input) => (predicate(input) ? ok(toValue(input)) : err(input)),
});

const run = <I, T>(input: I, plugins: readonly Plugin<I, T>[]): Result<T, I> => {
  const [head, ...tail] = plugins;
  if (head === undefined) return err(input);

  const result = head.run(input);
  if (result.isOk()) return result;

  return run(input, tail);
};

export const createRunner =
  <I, T>(plugins: readonly Plugin<I, T>[]) =>
  (input: I): Result<T, I> =>
    run(input, plugins);
