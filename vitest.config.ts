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
    projects: [
      {
        plugins: [react()],
        resolve: {
          tsconfigPaths: true,
          alias: {
            'next/image': path.resolve(__dirname, 'src/__mocks__/next/image.tsx'),
            'next/headers': path.resolve(__dirname, 'src/__mocks__/next/headers.ts'),
            'next/navigation': path.resolve(__dirname, 'src/__mocks__/next/navigation.ts'),
          },
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
