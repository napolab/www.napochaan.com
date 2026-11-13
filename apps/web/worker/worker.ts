import { handle } from '@astrojs/cloudflare/handler';

import { createWebEntrypoint } from './entrypoint';

import type { MountedFetch } from './app';

// 最外殻は WorkerEntrypoint クラス(worker/entrypoint)。fetch は Hono app(worker/app.ts)に委譲し、
// cms からの purge() RPC を同じ default entrypoint で受ける。Astro の SSR は adapter の
// `handle(request, env, ctx)` を Hono app の catch-all(worker/handlers/astro)に mount する。
export default createWebEntrypoint(handle as MountedFetch);

export { CursorRoom } from './durable-objects/cursor-room';
