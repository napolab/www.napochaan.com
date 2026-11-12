import { createMiddleware } from 'hono/factory';

// Payload の admin は host の root(payload.config の `routes.admin = '/'`)。
const ADMIN_ROOT = '/';

// admin ではない(または cross-site で開ける必要がある)セグメント。`/api` / `/api/...` のように
// セグメント境界で判定する(`/apix` や `/mcpx` は admin の catch-all に落ちるので admin 扱い)。
// - /api: REST / media / media-upload / mcp(Next の route handler)
// - /mcp, /.well-known: MCP の forward と OAuth metadata(Hono)
// - /cdn-cgi: Cloudflare(Access のログアウト等)
// - /_next: Next の静的アセット(通常は ASSETS が Worker より先に返すが念のため)
const NON_ADMIN_SEGMENTS = ['/api', '/mcp', '/.well-known', '/cdn-cgi', '/_next'] as const;
const NON_ADMIN_FILES = ['/favicon.ico'] as const;

// 不正な %-列は decode できないので生の pathname を返す。
const safeDecodePathname = (pathname: string): string => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};

const isWithinSegment =
  (segment: string) =>
  (pathname: string): boolean =>
    pathname === segment || pathname.startsWith(`${segment}/`);

const isNonAdminPath = (pathname: string): boolean => NON_ADMIN_SEGMENTS.some((segment) => isWithinSegment(segment)(pathname)) || NON_ADMIN_FILES.some((file) => pathname === file);

// 着地先(`/`)そのものでも、admin 以外のパスでもない = root より深い admin ページ。
// 生と decode 後の両方が admin 以外と判定できたときだけ通す(Next は percent-encoded path を同じ route に
// 解決するので、`/%61pi/...` や `/api%2Fx` は catch-all = admin に落ちうる)。
const isAdminDescendant = (pathname: string): boolean => {
  if (pathname === ADMIN_ROOT) return false;
  return !(isNonAdminPath(pathname) && isNonAdminPath(safeDecodePathname(pathname)));
};

const isCrossSiteNavigation = (request: Request): boolean => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  return request.headers.get('Sec-Fetch-Site') === 'cross-site' && request.headers.get('Sec-Fetch-Dest') === 'document';
};

// Payload の cloudflare-access strategy は、Origin の無いクロスサイトのトップレベル遷移を認証する
// (Access ログイン直後の着地は IdP 経由の cross-site リダイレクトなので、拒否すると誰もログインできない)。
// strategy は headers しか受け取らずパスを見られないので、着地先の制限はここで掛ける: 他サイトからの遷移は
// admin の root(`/`)だけを描画させ、それより深い admin ページ(GET の描画で autosave の下書きや一覧の
// preference を書き込む画面)は `/` へ送る。`/api` などの admin 以外のパスは対象外。302 は fetch metadata
// 次第で変わるので、エッジにもブラウザにも保存させない。
// OpenNext の mount より前に登録すること(順序の回帰は worker-app.test.ts が検出する)。
export const adminLanding = () =>
  createMiddleware(async (c, next) => {
    if (!isCrossSiteNavigation(c.req.raw)) return next();
    if (!isAdminDescendant(new URL(c.req.url).pathname)) return next();

    return new Response(null, { status: 302, headers: { Location: ADMIN_ROOT, 'Cache-Control': 'no-store' } });
  });
