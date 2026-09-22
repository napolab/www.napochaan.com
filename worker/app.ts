import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

import { imageHandlers } from './handlers/images';
import { cacheControlHeaders } from './middleware/cache-control';
import { weakenETag } from './middleware/weaken-etag';
import { cursorRoutes } from './routes/cursors';
import { mcpGuardRoutes } from './routes/mcp-guard';

type HonoEnv = { Bindings: Cloudflare.Env };

export type MountedFetch = (request: Request, ...args: unknown[]) => Promise<Response>;

// worker.ts と共有する Hono 合成。mcpGuardRoutes は mount より前に登録すること —
// この順序が /api/mcp の外部遮断(セキュリティ境界)を成立させる。順序の回帰は
// worker/app.test.ts が検出する。
export const createWorkerApp = (handlerFetch: MountedFetch) => {
  const factory = createFactory<HonoEnv>();
  const app = factory.createApp();

  app
    .use('*', weakenETag())
    .use('*', cacheControlHeaders())
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
    .route('/', mcpGuardRoutes)
    .mount('/', handlerFetch);

  return app;
};
