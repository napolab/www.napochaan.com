import { createMiddleware } from 'hono/factory';

const ADMIN_ROOT = '/admin';

// 不正な %-列は decode できないので生の pathname を返す(判定対象の prefix は % を含まない)。
const safeDecodePathname = (pathname: string): string => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};

// `/admin/` で始まり、`/admin/` そのものではない(`/admin` と `/admin/` は着地先)。
const isAdminDescendant = (pathname: string): boolean => pathname.startsWith(`${ADMIN_ROOT}/`) && pathname !== `${ADMIN_ROOT}/`;

const isCrossSiteNavigation = (request: Request): boolean => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  return request.headers.get('Sec-Fetch-Site') === 'cross-site' && request.headers.get('Sec-Fetch-Dest') === 'document';
};

// Payload の cloudflare-access strategy は、Origin の無いクロスサイトのトップレベル遷移を認証する
// (Access ログイン直後の着地は IdP 経由の cross-site リダイレクトなので、拒否すると誰もログインできない)。
// strategy は headers しか受け取らずパスを見られないので、着地先の制限はここで掛ける: 他サイトからの遷移は
// `/admin` だけを描画させ、それより深い admin ページ(GET の描画で autosave の下書きや一覧の preference を
// 書き込む画面)は `/admin` へ送る。302 は fetch metadata 次第で変わるので、エッジにもブラウザにも保存させない。
// OpenNext の mount より前に登録すること(順序の回帰は worker-app.test.ts が検出する)。
export const adminLanding = () =>
  createMiddleware(async (c, next) => {
    if (!isCrossSiteNavigation(c.req.raw)) return next();
    const pathname = new URL(c.req.url).pathname;
    // 生と decode 後の両方で判定する(Next は percent-encoded path を同じ route に解決する)。
    if (!isAdminDescendant(pathname) && !isAdminDescendant(safeDecodePathname(pathname))) return next();

    return new Response(null, { status: 302, headers: { Location: ADMIN_ROOT, 'Cache-Control': 'no-store' } });
  });
