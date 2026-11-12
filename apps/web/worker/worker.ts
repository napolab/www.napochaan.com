// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

import { createWorkerApp, type MountedFetch } from './app';

// 最外殻は Hono app そのもの。/mcp の認証は前段の Cloudflare Access(パス単位アプリ)と
// Next の /api/mcp(Cf-Access-Jwt-Assertion を自前で検証)が担い、worker は forward するだけ
// (worker/routes/mcp)。
const app = createWorkerApp(handler.fetch as MountedFetch);

export default { fetch: app.fetch } satisfies ExportedHandler<Cloudflare.Env>;

// @ts-ignore - Generated at build time by OpenNext
export { DOQueueHandler } from '../.open-next/worker.js';
export { CursorRoom } from './durable-objects/cursor-room';
