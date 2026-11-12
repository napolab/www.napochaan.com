// `/%61dmin` や `/admin%2Fcollections` のような percent-encoding でも Next 側は同じ route に解決するので、
// パスで判定する middleware は decode 後で判定する。不正な %-列は decode できないので生の pathname を返す
// (判定対象の prefix は % を含まないので、生の pathname が一致するなら decode 後も必ず一致する)。
export const safeDecodePathname = (pathname: string): string => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};
