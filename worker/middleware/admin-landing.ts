import { createMiddleware } from 'hono/factory';

import { safeDecodePathname } from './safe-decode-pathname';

const ADMIN_ROOT = '/admin';
const NAVIGATION_METHODS: readonly string[] = ['GET', 'HEAD'];

export type NavigationRequest = { method: string; pathname: string; headers: Headers };

// `/admin` と `/admin/` は着地先そのものなので対象外。それより深いパスだけを見る。
const isDeepAdminPath = (pathname: string): boolean => {
  const decoded = safeDecodePathname(pathname);

  return decoded.startsWith(`${ADMIN_ROOT}/`) && decoded !== `${ADMIN_ROOT}/`;
};

const isCrossSiteDocument = (headers: Headers): boolean => headers.get('Sec-Fetch-Site') === 'cross-site' && headers.get('Sec-Fetch-Dest') === 'document';

export const isCrossSiteDeepAdminNavigation = ({ method, pathname, headers }: NavigationRequest): boolean =>
  NAVIGATION_METHODS.includes(method) && isCrossSiteDocument(headers) && isDeepAdminPath(pathname);

// Payload の cloudflare-access strategy は、Origin の無いクロスサイトのトップレベル遷移を認証する
// (Access ログイン直後の着地は IdP 経由の cross-site リダイレクトなので、拒否すると誰もログインできない)。
// strategy は headers しか受け取らずパスを見られないので、着地先の制限はここで掛ける: 他サイトからの遷移は
// `/admin` だけを描画させ、それより深い admin ページ(GET の描画で autosave の下書きや一覧の preference を
// 書き込む画面)は `/admin` へ送る。302 は fetch metadata 次第で変わるので、エッジにもブラウザにも保存させない。
export const adminCrossSiteLanding = () =>
  createMiddleware(async (c, next) => {
    const request = { method: c.req.method, pathname: new URL(c.req.url).pathname, headers: c.req.raw.headers };
    if (!isCrossSiteDeepAdminNavigation(request)) return next();

    c.header('Cache-Control', 'no-store');
    return c.redirect(ADMIN_ROOT, 302);
  });
