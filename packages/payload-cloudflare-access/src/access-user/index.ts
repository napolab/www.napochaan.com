// import を持たない module。'use server' の action や RSC からも、strategy(jose / payload)を
// 巻き込まずに「この user は Cloudflare Access strategy で認証されたか」を判定できる。
export const ACCESS_STRATEGY_NAME = 'cloudflare-access';

// Payload は認証した strategy の名前を実行時の user._strategy に入れる(local-jwt / api-key など)。
// payload.auth の戻り値の型(TypedUser)には `_strategy` が無いので、引数は object で受けて `in` で絞る
// (`{ _strategy?: string }` で受けると weak type 検査で TypedUser を渡せない)。
export const isCloudflareAccessUser = (user: object | null | undefined): boolean => {
  if (user === null || user === undefined) return false;

  return '_strategy' in user && user._strategy === ACCESS_STRATEGY_NAME;
};
