import path from 'node:path';

import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
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
            // `@lib/cms/client` reads the `CMS` Service Binding from the per-request
            // context, which does not exist in the browser. Swap in a client over the
            // cms Hono app with fixture services (data helpers are normally mocked
            // per-test). See src/__mocks__/cms-client.ts.
            '@lib/cms/client': path.resolve(import.meta.dirname, 'src/__mocks__/cms-client.ts'),
            // Astro's client router is only available inside an Astro build.
            'astro:transitions/client': path.resolve(import.meta.dirname, 'src/__mocks__/astro-transitions-client.ts'),
            // Astro Actions' client proxy is likewise build-only (the contact form).
            'astro:actions': path.resolve(import.meta.dirname, 'src/__mocks__/astro-actions.ts'),
          },
        },
        // Pre-bundle every browser-test dependency up front so Vite does not
        // trigger a mid-run reload ("optimized dependencies changed. reloading").
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react-dom/server',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-aria-components',
            'vitest-browser-react',
            '@internationalized/date',
            'gsap',
            'gsap/ScrambleTextPlugin',
            '@payloadcms/richtext-lexical/react',
            '@payloadcms/live-preview-react',
            '@radix-ui/react-slot',
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
            'dayjs/plugin/customParseFormat',
            'durabcast/helpers/client',
            'hono',
            'hono/client',
            '@hono/zod-validator',
            'reconnecting-websocket',
            'fast-json-stable-stringify',
            'zod',
            '@marsidev/react-turnstile',
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
          // `.astro` renders need Astro's Vite plugins: see vitest.astro.config.ts.
          exclude: [...configDefaults.exclude, 'src/layouts/**', 'src/pages/**', 'src/**/*.astro.test.ts'],
        },
      },
      './vitest.astro.config.ts',
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
