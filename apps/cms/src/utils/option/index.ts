// 「値が有る / 無い」を表すタグ付き union(不在はエラーではないので Result ではなくこちら)。
// discriminant は `some`(branching-modeled-state-with-switch / precise-type-modeling)。
export type Option<T> = { some: true; value: T } | { some: false };

export const some = <T>(value: T): Option<T> => ({ some: true, value });

export const none: Option<never> = { some: false };

// some なら値を some ハンドラへ、none なら none ハンドラを呼ぶ。分岐を 1 箇所に閉じ込め、
// 呼び出し側は結果の値だけを受け取る。
export const matchOption = <T, R>(option: Option<T>, handlers: { some: (value: T) => R; none: () => R }): R => {
  if (option.some) return handlers.some(option.value);

  return handlers.none();
};
