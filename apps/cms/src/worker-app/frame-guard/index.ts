import { createMiddleware } from 'hono/factory';

export const SAME_ORIGIN_FRAME_ANCESTORS = "frame-ancestors 'self'";
const SAME_ORIGIN_X_FRAME_OPTIONS = 'SAMEORIGIN';

const isBlank = (value: string): boolean => value.trim() === '';

const hasFrameAncestors = (csp: string): boolean => csp.split(';').some((directive) => directive.trim().toLowerCase().startsWith('frame-ancestors'));

const appendDirective = (csp: string, directive: string): string => `${csp.replace(/;\s*$/, '')}; ${directive}`;

// 上流の CSP は壊さない。frame-ancestors を持たない時だけ末尾に足す。
export const resolveCSP = (existing: string | null, frameAncestors: string): string => {
  if (existing === null || isBlank(existing)) return frameAncestors;
  if (hasFrameAncestors(existing)) return existing;

  return appendDirective(existing, frameAncestors);
};

// Access が有効だと admin はクロスサイトの iframe の中でも認証済みで描画される(clickjacking)。
// cms ホストには他 origin から埋め込まれるべき画面が無い(Live Preview が iframe に入れるのは web 側の
// preview ページ)ので、ホスト全体で同一 origin 以外からの埋め込みを禁止する。MCP / OAuth metadata /
// media-upload の JSON に付いても無害。
// 終端後の c.header() は Response を作り直すので、mount した handler の immutable な headers でも書ける。
// OpenNext の mount より前に登録すること(順序の回帰は worker-app.test.ts が検出する)。
export const frameGuard = () =>
  createMiddleware(async (c, next) => {
    await next();
    c.header('Content-Security-Policy', resolveCSP(c.res.headers.get('Content-Security-Policy'), SAME_ORIGIN_FRAME_ANCESTORS));
    c.header('X-Frame-Options', SAME_ORIGIN_X_FRAME_OPTIONS);
  });
