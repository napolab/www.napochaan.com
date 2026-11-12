import { defineConfig } from 'vitest/config';

// The copied Payload tests are all node-side `.test.ts` units (no browser tests in cms).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'unit',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
