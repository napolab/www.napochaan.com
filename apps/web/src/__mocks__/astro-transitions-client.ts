import { vi } from 'vitest';

// Browser-test stand-in for `astro:transitions/client` (aliased in vitest.config.ts):
// the virtual module only exists inside an Astro build. Tests assert on `navigate`.
export const navigate = vi.fn(async (_href: string, _options?: { history?: 'auto' | 'push' | 'replace' }) => {});
