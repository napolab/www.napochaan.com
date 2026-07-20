import { ok } from 'neverthrow';

import type { Result } from 'neverthrow';

// 逐次バリデーションの汎用 plugin 契約。prefix-match-processor の run-plugins(first-match)
// とは極性が逆で、各 validator は input を受け取り、通れば ok(input)(次へ委譲)、弾けば
// err(E) を返す。runValidators はこれを先頭から順に通し、最初の err で短絡する。
// null / boolean / throw は禁止 — runner が Result で連鎖するため。
export interface Validator<T, E> {
  run(input: T): Result<T, E>;
}

// validators を先頭から順に通し、最初に err を返したもので短絡する(全 pass なら ok(input))。
// 空なら ok(input)。andThen の連鎖なので、err の後段 validator は評価されない。
export const runValidators = <T, E>(input: T, validators: readonly Validator<T, E>[]): Result<T, E> =>
  validators.reduce<Result<T, E>>((acc, validator) => acc.andThen((value) => validator.run(value)), ok(input));

// validators を固定した具体 validator 関数に落とし込む factory(利用側で使う)。
// run-plugins の createRunner と対をなす、sequence 極性版。
export const createValidator =
  <T, E>(validators: readonly Validator<T, E>[]) =>
  (input: T): Result<T, E> =>
    runValidators(input, validators);
