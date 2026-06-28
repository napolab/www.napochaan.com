import path from 'node:path';

import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
    // browser mode は CI 素環境で Vite の依存最適化による mid-run リロードが起き、
    // 進行中の dynamic import が "Failed to fetch" になることがある（フレーク）。
    // CI のみ retry してこの一過性の取りこぼしを吸収する（ローカルは 0 で即検知）。
    retry: process.env.CI ? 2 : 0,
    projects: [
      {
        plugins: [react()],
        resolve: {
          tsconfigPaths: true,
          alias: {
            'next/image': path.resolve(__dirname, 'src/__mocks__/next/image.tsx'),
            'next/headers': path.resolve(__dirname, 'src/__mocks__/next/headers.ts'),
            'next/navigation': path.resolve(__dirname, 'src/__mocks__/next/navigation.ts'),
            // Payload data helpers wrap queries in `unstable_cache` / call the
            // revalidators; pulling the real Next server-cache into the browser
            // bundle makes Vite discover it mid-run and reload, failing in-flight
            // test imports. Stub it — these never run in browser tests.
            'next/cache': path.resolve(__dirname, 'src/__mocks__/next/cache.ts'),
            // `@lib/payload/client` calls `getPayload({ config })` at module scope,
            // dragging the whole payload package (+ every collection) into the
            // browser bundle. optimizeDeps then crashes on Node-only deps (e.g.
            // `file-type`) or keeps discovering payload deps mid-run and reloads,
            // failing in-flight test imports. Stub it — data helpers are mocked
            // per-test, so the real client never runs. See src/__mocks__/payload-client.ts.
            '@lib/payload/client': path.resolve(__dirname, 'src/__mocks__/payload-client.ts'),
          },
        },
        // Pre-bundle every browser-test dependency up front. Otherwise Vite
        // discovers some of them late and triggers a mid-run reload
        // ("optimized dependencies changed. reloading"), which makes an in-flight
        // test-file import fail with "Failed to fetch dynamically imported module"
        // — a suite-level failure `retry` cannot recover. Keep in sync with the
        // deps surfaced by `DEBUG=vite:deps` (node_modules/.vite/.../_metadata.json).
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-aria-components',
            'vitest-browser-react',
            '@gsap/react',
            'gsap',
            'gsap/ScrambleTextPlugin',
            'gsap/ScrollToPlugin',
            'gsap/ScrollTrigger',
            '@marsidev/react-turnstile',
            '@opennextjs/cloudflare',
            '@payloadcms/richtext-lexical/react',
            'shiki/core',
            'shiki/engine/javascript',
            '@shikijs/langs/bash',
            '@shikijs/langs/css',
            '@shikijs/langs/json',
            '@shikijs/langs/tsx',
            '@shikijs/langs/typescript',
            'hast-util-to-jsx-runtime',
            'budoux',
            'dayjs',
            'dayjs/plugin/utc',
            'dayjs/plugin/timezone',
            'durabcast/helpers/client',
            'hono/client',
            'reconnecting-websocket',
            'fast-json-stable-stringify',
            'zod',
          ],
        },
        test: {
          name: 'browser',
          include: ['src/**/*.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.toml', environment: 'test' },
          }),
        ],
        test: {
          name: 'workers',
          include: ['worker/**/*.test.ts'],
        },
      },
    ],
  },
});
