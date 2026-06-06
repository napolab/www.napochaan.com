import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

import { imageHandlers } from './handlers/images';
import { cursorRoutes } from './routes/cursors';

type HonoEnv = {
  Bindings: Cloudflare.Env;
};

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

app.get(
  '/_next/image',
  cache({
    cacheName: 'opennextjs-cloudflare-images',
    cacheControl: 'public, max-age=3600, must-revalidate',
    vary: ['Accept', 'Accept-Encoding'],
  }),
  ...imageHandlers,
);

app.route('/', cursorRoutes);

app.mount('/', handler.fetch as (request: Request, ...args: unknown[]) => Promise<Response>);

export default {
  ...app,
} satisfies ExportedHandler<Cloudflare.Env>;

// @ts-ignore - Generated at build time by OpenNext
export { DOQueueHandler } from '../.open-next/worker.js';
export { CursorRoom } from './durable-objects/cursor-room';
