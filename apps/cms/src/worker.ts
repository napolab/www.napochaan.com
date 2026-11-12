import { WorkerEntrypoint } from 'cloudflare:workers';
import { createApp } from '@napochaan/cms-api/app';

import { BucketCachePurge, default as handler, DOQueueHandler, DOShardedTagCache } from '../.open-next/worker.js';
import { createPayloadServices } from './services';

// Pinned to the declared shape: after a build TypeScript resolves the real JS and
// infers `fetch(): Promise<unknown>` (see `src/rpc/local-payload` for the same case).
const openNext = handler as unknown as OpenNextWorker;

// OpenNext serves the Payload admin / REST API on the public hostname.
export default { fetch: openNext.fetch } satisfies ExportedHandler<CloudflareEnv>;

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
