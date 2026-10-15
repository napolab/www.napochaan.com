import { createMiddleware } from 'hono/factory';

import { safeDecodePathname } from './safe-decode-pathname';

export type FramePolicy = { frameAncestors: string; xFrameOptions: string };

// Access が有効だと admin はクロスサイトの iframe の中でも認証済みで描画される。admin 自身を
// iframe に入れる画面は無い(Live Preview が iframe に入れるのは /next/preview → サイト側の
// preview ページで、/admin ではない)ので、同一 origin 以外からの埋め込みを禁止する。
export const SAME_ORIGIN_FRAMING: FramePolicy = { frameAncestors: "frame-ancestors 'self'", xFrameOptions: 'SAMEORIGIN' };

const ADMIN_PATH = '/admin';

// 先頭から順に照合する。パスは完全一致か `<path>/` 始まりだけ(`/administrator` は対象外)。
const FRAME_POLICIES: readonly { path: string; policy: FramePolicy }[] = [{ path: ADMIN_PATH, policy: SAME_ORIGIN_FRAMING }];

const matchesPath = (pathname: string, path: string): boolean => pathname === path || pathname.startsWith(`${path}/`);

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
