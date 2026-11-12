import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

import { imageHandlers } from './handlers/images';
import { cacheControlHeaders } from './middleware/cache-control';
import { pathPolicy } from './middleware/path-policy';
import { weakenETag } from './middleware/weaken-etag';
import { cursorRoutes } from './routes/cursors';

type HonoEnv = { Bindings: Cloudflare.Env };

export type MountedFetch = (request: Request, ...args: unknown[]) => Promise<Response>;

// worker.ts と共有する Hono 合成。MCP(/mcp・/api/mcp・OAuth discovery)と /api/media-upload は
// apps/cms に移った(apps/cms/src/worker-app)。
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
    .mount('/', handlerFetch);

  return app;
};
