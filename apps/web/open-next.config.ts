import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// No incremental cache / tag cache / queue: every page is SSR (`force-dynamic`) and the
// rendered responses are cached by Workers Cache in front of the Worker, per the
// Cache-Control the worker's cache-control middleware stamps. CMS publishes purge it via
// the cms Worker's `env.WEB.purge()` RPC (worker/entrypoint). See .claude/rules/workers-cache.md.
export default defineCloudflareConfig({});
