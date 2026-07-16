import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

import { imageHandlers } from './handlers/images';
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
    .get(
      '/_next/image',
      cache({
        cacheName: 'opennextjs-cloudflare-images',
        cacheControl: 'public, max-age=3600, must-revalidate',
        vary: ['Accept', 'Accept-Encoding'],
      }),
      ...imageHandlers,
    )
    .route('/', cursorRoutes)
    .route('/', mcpGuardRoutes)
    .mount('/', handlerFetch);

  return app;
};
