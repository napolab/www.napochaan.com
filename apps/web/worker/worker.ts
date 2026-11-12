// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

import { createWebEntrypoint } from './entrypoint';

import type { MountedFetch } from './app';

// 最外殻は WorkerEntrypoint クラス(worker/entrypoint)。fetch は Hono app(worker/app.ts)に委譲し、
// cms からの purge() RPC を同じ default entrypoint で受ける。MCP は apps/cms の worker に移った。
export default createWebEntrypoint(handler.fetch as MountedFetch);

export { CursorRoom } from './durable-objects/cursor-room';
