import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

import { createAstroHandler } from './handlers/astro';
import { imageHandlers } from './handlers/images';
import { cacheControlHeaders } from './middleware/cache-control';
import { pathPolicy } from './middleware/path-policy';
import { weakenETag } from './middleware/weaken-etag';
import { cursorRoutes } from './routes/cursors';

import type { CMSHealthVariables } from './lib/cms-health';

type HonoEnv = { Bindings: Cloudflare.Env; Variables: CMSHealthVariables };

export type MountedFetch = (request: Request, ...args: unknown[]) => Promise<Response>;

// worker.ts と共有する Hono 合成。web は表示専用で、CMS のデータは env.CMS(Hono RPC)経由で読む。
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
    // Astro, with this request's CMS binding tracked (a degraded render is never cached).
    .all('*', createAstroHandler(handlerFetch));

  return app;
};
