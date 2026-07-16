import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

// OAuthProvider(worker/worker.ts)はリクエスト処理前に env へ OAUTH_PROVIDER を
// 注入する。cloudflare-env.d.ts は wrangler.toml 由来の生成物なのでこの実行時
// メンバーを知らない — ここで runtime guard 付きで取り出す。
// `next dev`(worker シェル非経由)では undefined になる。
export const getOAuthHelpers = (env: unknown): OAuthHelpers | undefined => {
  if (typeof env !== 'object' || env === null) return undefined;
  if (!('OAUTH_PROVIDER' in env)) return undefined;
  const candidate = (env as { OAUTH_PROVIDER: unknown }).OAUTH_PROVIDER;
  if (typeof candidate !== 'object' || candidate === null) return undefined;

  return candidate as OAuthHelpers;
};
