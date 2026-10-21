import { generateExpiredPayloadCookie } from 'payload/shared';

import { isAllowedCookieRequest } from '../csrf';

import type { Endpoint, PayloadRequest, SanitizedCollectionConfig, TypedUser } from 'payload';

// 対象 collection の REST に足す(`/api/<slug>/access-logout`)。Payload 3.84.1 は collection の endpoints を
// 利用者の分 → auth / upload / 既定(`/:id` など)の順に並べ(collections/config/sanitize.js)、handleEndpoints は
// 先頭から method と path で find するので、既定の route より先に一致する。
export const ACCESS_LOGOUT_ENDPOINT_PATH = '/access-logout';

// Cloudflare Access はこのエッジの endpoint でセッションを終える(team の全 Access アプリが対象)。
export const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';

// Next の draft mode の cookie。名前は next/dist/server/api-utils/index.js の COOKIE_NAME_PRERENDER_BYPASS、
// 属性は next/dist/server/async-storage/draft-mode-provider.js の enable() / disable()(本番は path=/ ・
// HttpOnly ・ Secure ・ SameSite=None)に合わせる。名前・path が違うと別の cookie として残る。
export const PRERENDER_BYPASS_COOKIE_NAME = '__prerender_bypass';

export type AccessLogoutContext = {
  headers: Headers;
  csrf: readonly string[];
  cookiePrefix: string;
  // sanitize 済みの auth。cookie の Domain / SameSite / Secure は発行時と同じでないと消えない。
  authConfig: SanitizedCollectionConfig['auth'];
};

// 別サイトの form POST で本人をログアウトさせない。判定は Payload の cookie 経路と同じ表(csrf/index.ts)。
export const isSameSiteLogout = ({ headers, csrf }: AccessLogoutContext): boolean => isAllowedCookieRequest(headers, csrf);

// Access の user にも `/api/<slug>/refresh-token` が `<cookiePrefix>-token` を発行する(auth/operations/refresh.js)。
export const expiredPayloadTokenCookie = ({ cookiePrefix, authConfig }: AccessLogoutContext): string => generateExpiredPayloadCookie({ collectionAuthConfig: authConfig, cookiePrefix });

// 残すと、ログアウト後もそのブラウザで preview ページが下書きを表示し続ける。
// Next の disable() と同じく Expires を過去にし、Max-Age=0 も付ける。
export const expiredDraftModeCookie = (): string =>
  [`${PRERENDER_BYPASS_COOKIE_NAME}=`, 'Path=/', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'Max-Age=0', 'HttpOnly', 'Secure', 'SameSite=None'].join('; ');

const noStoreHeaders = (): Headers => new Headers({ 'Cache-Control': 'no-store' });

const forbidCrossSiteLogout = (): Response => Response.json({ message: 'Cross-site logout requests are not allowed' }, { status: 403, headers: noStoreHeaders() });

// 303 なので、form の POST はブラウザが GET で Access のログアウトへ移る。
const redirectToAccessLogout = (expiredCookies: readonly string[]): Response => {
  const headers = noStoreHeaders();
  headers.set('Location', ACCESS_LOGOUT_PATH);
  for (const cookie of expiredCookies) headers.append('Set-Cookie', cookie);

  return new Response(null, { status: 303, headers });
};

export const respondToAccessLogout = (context: AccessLogoutContext): Response => {
  if (!isSameSiteLogout(context)) return forbidCrossSiteLogout();

  return redirectToAccessLogout([expiredPayloadTokenCookie(context), expiredDraftModeCookie()]);
};

// endpoint は slug の collection に登録するので、その collection は必ず payload.collections に居る。
const toAccessLogoutContext = (req: PayloadRequest, slug: TypedUser['collection']): AccessLogoutContext => ({
  headers: req.headers,
  csrf: req.payload.config.csrf,
  cookiePrefix: req.payload.config.cookiePrefix,
  authConfig: req.payload.collections[slug].config.auth,
});

// user が解決できたかは見ない。cookie を消すだけなので、未ログインでも同じ応答を返してよい。
export const createAccessLogoutEndpoint = (slug: TypedUser['collection']): Endpoint => ({
  path: ACCESS_LOGOUT_ENDPOINT_PATH,
  method: 'post',
  handler: (req) => respondToAccessLogout(toAccessLogoutContext(req, slug)),
});
