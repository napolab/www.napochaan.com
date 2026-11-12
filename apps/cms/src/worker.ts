// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

// OpenNext's fetch handler is the whole Worker for now. Later tasks add the `CMS`
// WorkerEntrypoint (Hono RPC services) next to it.
export default { fetch: handler.fetch } satisfies ExportedHandler<CloudflareEnv>;
