import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Runtime probes that must execute on real workerd (vitest workers pool) instead of node.
const WORKERD_TESTS = ['src/worker-runtime/**/*.test.ts'];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: WORKERD_TESTS,
        },
      },
      {
        // No wrangler config on purpose: `wrangler.jsonc` would drag in `.open-next/assets`
        // (absent before a build) and the D1/R2 bindings. The probes only need the runtime
        // itself, so pin the same compatibility settings as wrangler.jsonc here.
        plugins: [
          cloudflareTest({
            miniflare: { compatibilityDate: '2025-08-15', compatibilityFlags: ['nodejs_compat'] },
          }),
        ],
        test: {
          name: 'workers',
          include: WORKERD_TESTS,
        },
      },
    ],
  },
});
