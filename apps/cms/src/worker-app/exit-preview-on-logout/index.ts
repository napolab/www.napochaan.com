import { createMiddleware } from 'hono/factory';

// @napolab/payload-cloudflare-access の logout endpoint(POST /api/<slug>/access-logout)の応答形。
// 同一 origin の検査を通ると、payload-token と __prerender_bypass を消す Set-Cookie を付けて
// `303 Location: /cdn-cgi/access/logout` を返す(dist/logout-endpoint の ACCESS_LOGOUT_PATH)。
const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';
const SEE_OTHER = 303;
const EXIT_PREVIEW_PATH = '/next/exit-preview';

type LogoutOrigins = { WEB_ORIGIN: string; CMS_ORIGIN: string };

const parseOrigin = (value: string): string | undefined => {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const isPost = (request: Request): boolean => request.method === 'POST';

const isAccessLogoutRedirect = (response: Response): boolean => response.status === SEE_OTHER && response.headers.get('Location') === ACCESS_LOGOUT_PATH;

// web の /next/exit-preview で draft mode を消してから、cms の Access ログアウトへ戻す。
// stg の web も Access 配下なので、Access セッションが生きている間に web を先に通す必要がある。
// redirect 先は web 側で CMS_ORIGIN と完全一致する origin だけ許可される(open redirect にしない)。
export const toExitPreviewLocation = (location: string, { WEB_ORIGIN, CMS_ORIGIN }: LogoutOrigins): string | undefined => {
  const webOrigin = parseOrigin(WEB_ORIGIN);
  const cmsOrigin = parseOrigin(CMS_ORIGIN);
  if (webOrigin === undefined || cmsOrigin === undefined) return undefined;

  const exitPreview = new URL(EXIT_PREVIEW_PATH, webOrigin);
  exitPreview.searchParams.set('redirect', new URL(location, cmsOrigin).href);
  return exitPreview.href;
};

// draft mode の cookie は web の origin にあるので、cms 側の logout endpoint が消す __prerender_bypass は
// 別物(cms の origin)。cms のログアウトで web の draft mode も終わらせるため、endpoint の
// 303 を web の /next/exit-preview 経由に書き換える。Payload の afterLogout hook は戻り値で応答を
// 変えられず、admin.routes.logout は admin の view パスでしかない。どちらも Access 有効時の
// logout(plugin の endpoint)では走らないので、応答の形(POST・303・Location)で判定してここで掛ける。
// OpenNext の mount より前に登録すること(順序の回帰は worker-app.test.ts が検出する)。
export const exitPreviewOnLogout = () =>
  createMiddleware<{ Bindings: LogoutOrigins }>(async (c, next) => {
    await next();
    if (!isPost(c.req.raw) || !isAccessLogoutRedirect(c.res)) return;

    const location = toExitPreviewLocation(ACCESS_LOGOUT_PATH, c.env);
    if (location === undefined) return;
    c.header('Location', location);
  });
