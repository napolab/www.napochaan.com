import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// Every page is SSR (no prerender) and cached by Workers Cache in front of the Worker
// (.claude/rules/workers-cache.md). The Worker entry is wrangler.toml `main`
// (worker/worker.ts), which mounts the adapter's handler inside the Hono app.
export default defineConfig({
  output: 'server',
  // No Astro sessions: the adapter would otherwise auto-provision a SESSION KV binding,
  // and per-visitor state has no place on Workers-Cache'd pages.
  session: false,
  adapter: cloudflare(),
  integrations: [react()],
});
