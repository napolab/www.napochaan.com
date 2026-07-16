import { OAuthProvider } from '@cloudflare/workers-oauth-provider';

// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

import { createWorkerApp, type MountedFetch } from './app';

const app = createWorkerApp(handler.fetch as MountedFetch);

// OAuthProvider が Bearer token を検証し grant props を ctx.props に復号済み。
// Next の /api/mcp へ in-process forward する(Hono を経由しないので mcp-guard に
// 掛からない)。Pair: src/app/api/mcp/route.ts が x-mcp-user-id を読む。
const mcpAPIHandler = {
  fetch: async (request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> => {
    const props = (ctx as { props?: { userID?: number } }).props ?? {};
    if (props.userID === undefined) return new Response('Unauthorized', { status: 401 });
    const url = new URL(request.url);
    url.pathname = '/api/mcp';
    const forwarded = new Request(url, request);
    forwarded.headers.set('x-mcp-user-id', `${props.userID}`);
    return (handler.fetch as (request: Request, env: Cloudflare.Env, ctx: ExecutionContext) => Promise<Response>)(forwarded, env, ctx);
  },
};

// 最外殻。/mcp(API)と /oauth/token・/oauth/register はライブラリが処理し、
// それ以外(サイト本体・admin・/oauth/authorize ページ)は既存 Hono app に落ちる。
// KV binding "OAUTH_KV" 必須(ライブラリにハードコードされた名前)。
export default new OAuthProvider<Cloudflare.Env>({
  apiRoute: '/mcp',
  apiHandler: mcpAPIHandler,
  defaultHandler: {
    fetch: async (request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> => app.fetch(request, env, ctx),
  },
  authorizeEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['blog'],
});

// @ts-ignore - Generated at build time by OpenNext
export { DOQueueHandler } from '../.open-next/worker.js';
export { CursorRoom } from './durable-objects/cursor-room';
