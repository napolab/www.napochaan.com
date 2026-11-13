import { getViteConfig } from 'astro/config';

// `.astro` components need Astro's Vite plugins to compile, which the plain `unit`
// project lacks. Layout / page tests render through the Astro Container API here.
// The Cloudflare adapter is dropped: its Vite plugin runs a workerd environment that
// vitest's node pool does not need (the render itself is runtime-agnostic).
export default getViteConfig(
  {
    test: {
      name: 'astro',
      environment: 'node',
      // `*.astro.test.ts` next to an `.astro` component anywhere under src/.
      include: ['src/layouts/**/*.test.ts', 'src/pages/**/*.test.ts', 'src/**/*.astro.test.ts'],
    },
  },
  // `output: 'server'`: with src/actions present, Astro refuses a config that has no
  // adapter and no on-demand route (ActionsWithoutServerOutputError).
  { adapter: undefined, configFile: false, integrations: [], output: 'server' },
);
