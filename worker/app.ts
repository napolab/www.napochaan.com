import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

import { imageHandlers } from './handlers/images';
import { cacheControlHeaders } from './middleware/cache-control';
import { pathPolicy } from './middleware/path-policy';
import { weakenETag } from './middleware/weaken-etag';
import { cursorRoutes } from './routes/cursors';
import { createMCPRoutes } from './routes/mcp';
import { createMCPOAuthMetadataRoutes } from './routes/mcp-oauth-metadata';
import { mcpGuardRoutes } from './routes/mcp-guard';

type HonoEnv = { Bindings: Cloudflare.Env };

export type MountedFetch = (request: Request, ...args: unknown[]) => Promise<Response>;

// worker.ts と共有する Hono 合成。mcpGuardRoutes は mount より前に登録すること —
// この順序が /api/mcp の外部遮断(多層防御)を成立させる。/mcp の forward(createMCPRoutes)は
// handlerFetch を直接呼ぶので guard に掛からない。順序の回帰は worker/app.test.ts が検出する。
export const createWorkerApp = (handlerFetch: MountedFetch) => {
  const factory = createFactory<HonoEnv>();
  const app = factory.createApp();

  app
    .use('*', weakenETag())
    .use('*', cacheControlHeaders())
    // 上の 2 つより内側に置く。302 は status が 200 でないので cacheControlHeaders が public を付けず、
    // 自前の no-store のまま返る(Workers Cache にも保存されない)。
    .use('*', pathPolicy())
    .get(
      '/_next/image',
      cache({
        cacheName: 'opennextjs-cloudflare-images',
        // Workers Cache serves hits without invoking the Worker; drop must-revalidate
        // so stale-while-revalidate applies. Media changes purge everything.
        cacheControl: 'public, max-age=86400, stale-while-revalidate=604800',
        vary: ['Accept', 'Accept-Encoding'],
      }),
      ...imageHandlers,
    )
    .route('/', cursorRoutes)
    // MCP Access が未設定なら next() で mount(Next の 404)に落ちる。
    .route('/', createMCPOAuthMetadataRoutes())
    .route('/', createMCPRoutes(handlerFetch))
    .route('/', mcpGuardRoutes)
    .mount('/', handlerFetch);

  return app;
};
