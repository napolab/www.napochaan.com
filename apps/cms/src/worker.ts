import { WorkerEntrypoint } from 'cloudflare:workers';
import { createApp } from '@napochaan/cms-api/app';

import { BucketCachePurge, default as handler, DOQueueHandler, DOShardedTagCache } from '../.open-next/worker.js';
import { createPayloadServices } from './services';
import { createWorkerApp } from './worker-app';

import type { MountedFetch } from './worker-app';

// Pinned to the declared shape: after a build TypeScript resolves the real JS and
// infers `fetch(): Promise<unknown>` (see `src/rpc/local-payload` for the same case).
const openNext = handler as unknown as OpenNextWorker;

// The public hostname is a Hono composition (src/worker-app): MCP OAuth discovery, `/mcp` → Next
// `/api/mcp` forwarding and the `/api/mcp/*` guard, then OpenNext (Payload admin / REST API /
// `/api/media-upload`). Authentication sits in front: the host-wide Cloudflare Access app.
// Hono passes (request, env, executionCtx) through, which is exactly OpenNext's signature; the
// mount type keeps the rest args `unknown`, so the narrower OpenNext signature needs the assertion
// (same as apps/web/worker/worker.ts).
const app = createWorkerApp(openNext.fetch as MountedFetch);

export default { fetch: app.fetch } satisfies ExportedHandler<CloudflareEnv>;

// The generated worker always exports these Durable Object classes. Keep them
// reachable from this entry module so a later `durable_objects` binding never
// points at a class the Worker no longer has.
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };

// Service-binding surface consumed by apps/web (`services[].entrypoint = "CMS"`):
// the shared Hono app (`hc<CMSAppType>`) over Payload-backed services.
export class CMS extends WorkerEntrypoint<CloudflareEnv> {
  override async fetch(request: Request): Promise<Response> {
    return createApp(createPayloadServices(this.env, this.ctx)).fetch(request);
  }
}
