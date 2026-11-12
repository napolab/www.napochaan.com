import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// No incremental cache / tag cache / queue: the cms serves the Payload admin and API
// only (all dynamic), so there is no ISR to back (spec §8).
export default defineCloudflareConfig({});
