import { createFactory } from 'hono/factory';

import { adminLanding } from './admin-landing';
import { createMCPRoutes } from '../worker-routes/mcp';
import { mcpGuardRoutes } from '../worker-routes/mcp-guard';
import { createMCPOAuthMetadataRoutes } from '../worker-routes/mcp-oauth-metadata';

type HonoEnv = { Bindings: CloudflareEnv };

// Hono の mount が受ける形(apps/web/worker/app.ts と同じ)。forward 側は app.request() で駆動するテストだと
// ExecutionContext が取れず undefined を渡すので、引数は unknown のまま受ける。
export type MountedFetch = (request: Request, ...args: unknown[]) => Promise<Response>;

// src/worker.ts の default fetch になる Hono 合成(`.open-next/worker.js` を import しないので node で
// テストできる)。mcpGuardRoutes は mount より前に登録すること — この順序が /api/mcp の外部遮断
// (多層防御)を成立させる。/mcp の forward(createMCPRoutes)は handlerFetch を直接呼ぶので guard に
// 掛からない。順序の回帰は worker-app.test.ts が検出する。
// /api/media-upload は Access の Bypass パスで、認可は route の HMAC 署名のみ。ここでは触らず mount に落とす。
export const createWorkerApp = (handlerFetch: MountedFetch) => {
  const factory = createFactory<HonoEnv>();
  const app = factory.createApp();

  app
    // cross-site の深い /admin 遷移を /admin へ(Payload の GET 描画が書込みをするため)。mount より前。
    .use('*', adminLanding())
    // MCP Access が未設定なら next() で mount(Next の 404)に落ちる。
    .route('/', createMCPOAuthMetadataRoutes())
    .route('/', createMCPRoutes(handlerFetch))
    .route('/', mcpGuardRoutes)
    .mount('/', handlerFetch);

  return app;
};
