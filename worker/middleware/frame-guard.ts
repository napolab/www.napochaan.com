import { createMiddleware } from 'hono/factory';

// /oauth/authorize は Access ログイン済みなら「許可する」ボタン 1 つだけの同意画面になる。
// 動的クライアント登録は公開なので、攻撃者が自分の client を登録して iframe に埋め、
// クリックジャッキングで承認させられる。同意画面のフレーム埋め込みは禁止する(RFC 9700)。
export const FRAME_ANCESTORS_NONE = "frame-ancestors 'none'";
export const X_FRAME_OPTIONS_DENY = 'DENY';

const GUARDED_PATH = '/oauth/authorize';

const matchesGuardedPath = (pathname: string): boolean => pathname === GUARDED_PATH || pathname.startsWith(`${GUARDED_PATH}/`);

// `/oauth/%61uthorize` のような percent-encoding でも Next 側は同じ route に解決するので、
// 生の pathname と decode 後の両方で判定する。不正な %-列は decode できないので生の pathname だけを見る。
const safeDecodePathname = (pathname: string): string => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};

export const isFrameGuardedPath = (pathname: string): boolean => matchesGuardedPath(pathname) || matchesGuardedPath(safeDecodePathname(pathname));

const hasFrameAncestors = (csp: string): boolean => csp.split(';').some((directive) => directive.trim().toLowerCase().startsWith('frame-ancestors'));

// 上流の CSP は壊さない。frame-ancestors を持たない時だけ末尾に足す。
export const resolveCSP = (existing: string | null): string => {
  if (existing === null || existing.trim() === '') return FRAME_ANCESTORS_NONE;
  if (hasFrameAncestors(existing)) return existing;

  return `${existing.replace(/;\s*$/, '')}; ${FRAME_ANCESTORS_NONE}`;
};

export const frameGuardHeaders = () =>
  createMiddleware(async (c, next) => {
    await next();

    if (!isFrameGuardedPath(new URL(c.req.url).pathname)) return;

    // Post-finalization c.header() rebuilds the response, which handles the
    // immutable headers of mounted handler responses (see weaken-etag.ts).
    c.header('Content-Security-Policy', resolveCSP(c.res.headers.get('Content-Security-Policy')));
    c.header('X-Frame-Options', X_FRAME_OPTIONS_DENY);
  });
