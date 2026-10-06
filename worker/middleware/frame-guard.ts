import { createMiddleware } from 'hono/factory';

import { OAUTH_AUTHORIZE_PATH } from '../oauth-endpoints';

export type FramePolicy = { frameAncestors: string; xFrameOptions: string };

// /oauth/authorize は Access ログイン済みなら「許可する」ボタン 1 つだけの同意画面になる。
// 動的クライアント登録は公開なので、攻撃者が自分の client を登録して iframe に埋め、
// クリックジャッキングで承認させられる。同意画面のフレーム埋め込みは一切禁止する(RFC 9700)。
export const DENY_FRAMING: FramePolicy = { frameAncestors: "frame-ancestors 'none'", xFrameOptions: 'DENY' };

// Access が有効だと admin はクロスサイトの iframe の中でも認証済みで描画される。admin 自身を
// iframe に入れる画面は無い(Live Preview が iframe に入れるのは /next/preview → サイト側の
// preview ページで、/admin ではない)ので、同一 origin 以外からの埋め込みを禁止する。
export const SAME_ORIGIN_FRAMING: FramePolicy = { frameAncestors: "frame-ancestors 'self'", xFrameOptions: 'SAMEORIGIN' };

const ADMIN_PATH = '/admin';

// 先頭から順に照合する。パスは完全一致か `<path>/` 始まりだけ(`/administrator` や
// `/oauth/authorizeX` は対象外)。
const FRAME_POLICIES: readonly { path: string; policy: FramePolicy }[] = [
  { path: OAUTH_AUTHORIZE_PATH, policy: DENY_FRAMING },
  { path: ADMIN_PATH, policy: SAME_ORIGIN_FRAMING },
];

const matchesPath = (pathname: string, path: string): boolean => pathname === path || pathname.startsWith(`${path}/`);

// `/oauth/%61uthorize` のような percent-encoding でも Next 側は同じ route に解決するので、decode 後で判定する。
// 不正な %-列は decode できないので生の pathname のまま判定する(guard 対象の prefix は % を含まないので、
// 生の pathname が一致するなら decode 後も必ず一致する)。
const safeDecodePathname = (pathname: string): string => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};

export const resolveFramePolicy = (pathname: string): FramePolicy | undefined => {
  const decoded = safeDecodePathname(pathname);

  return FRAME_POLICIES.find(({ path }) => matchesPath(decoded, path))?.policy;
};

const hasFrameAncestors = (csp: string): boolean => csp.split(';').some((directive) => directive.trim().toLowerCase().startsWith('frame-ancestors'));

// 上流の CSP は壊さない。frame-ancestors を持たない時だけ末尾に足す。
export const resolveCSP = (existing: string | null, frameAncestors: string): string => {
  if (existing === null || existing.trim() === '') return frameAncestors;
  if (hasFrameAncestors(existing)) return existing;

  return `${existing.replace(/;\s*$/, '')}; ${frameAncestors}`;
};

export const frameGuardHeaders = () =>
  createMiddleware(async (c, next) => {
    await next();

    const policy = resolveFramePolicy(new URL(c.req.url).pathname);
    if (policy === undefined) return;

    // Post-finalization c.header() rebuilds the response, which handles the
    // immutable headers of mounted handler responses (see weaken-etag.ts).
    c.header('Content-Security-Policy', resolveCSP(c.res.headers.get('Content-Security-Policy'), policy.frameAncestors));
    c.header('X-Frame-Options', policy.xFrameOptions);
  });
