// Test-only worker entry for the vitest "workers" pool.
//
// The production entry (`worker/worker.ts`) imports the Astro adapter handler
// (`@astrojs/cloudflare/handler`), which only resolves inside Astro's Vite build. The Durable
// Object tests only need the `CursorRoom` class to be instantiable, so this
// entry re-exports it without pulling in the Astro handler.

export { CursorRoom } from './durable-objects/cursor-room';

export default {
  async fetch(): Promise<Response> {
    return new Response('test entry', { status: 404 });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
