// Test-only worker entry for the vitest "workers" pool.
//
// The production entry (`worker/worker.ts`) imports the OpenNext build artifact
// `../.open-next/worker.js`, which does not exist during tests. The Durable
// Object tests only need the `CursorRoom` class to be instantiable, so this
// entry re-exports it without pulling in the OpenNext handler.

export { CursorRoom } from './durable-objects/cursor-room';

export default {
  async fetch(): Promise<Response> {
    return new Response('test entry', { status: 404 });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
