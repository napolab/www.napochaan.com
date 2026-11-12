// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

import { createWorkerApp, type MountedFetch } from './app';

// 最外殻は Hono app そのもの(worker/app.ts)。MCP は apps/cms の worker に移った。
const app = createWorkerApp(handler.fetch as MountedFetch);

export default { fetch: app.fetch } satisfies ExportedHandler<Cloudflare.Env>;

// @ts-ignore - Generated at build time by OpenNext
export { DOQueueHandler } from '../.open-next/worker.js';
export { CursorRoom } from './durable-objects/cursor-room';
