import path from 'node:path';

import type { Plugin } from 'vite';

// Modules swapped out of the BROWSER bundle only. budoux's html_processor imports
// linkedom unconditionally, but our only client-reachable use (`@utils/phrase` →
// parser.parse) never touches it; the server keeps the real linkedom (OG
// `clamp-title` runs budoux there).
export const CLIENT_ALIASES = {
  linkedom: path.resolve(import.meta.dirname, '../../shims/linkedom-browser.ts'),
} as const satisfies Record<string, string>;

const isAliased = (id: string): id is keyof typeof CLIENT_ALIASES => Object.hasOwn(CLIENT_ALIASES, id);

// The replacement path for `id` in the given Vite environment, or undefined to
// resolve normally. Astro's browser build is the `client` environment.
export const resolveClientAlias = (id: string, environment: string): string | undefined => {
  if (environment !== 'client') return undefined;
  if (!isAliased(id)) return undefined;

  return CLIENT_ALIASES[id];
};

// Vite plugin applying CLIENT_ALIASES to the client environment only (a plain
// `resolve.alias` would also hit the SSR build).
export const clientAliases = (): Plugin => ({
  name: 'web-astro:client-aliases',
  enforce: 'pre',
  resolveId(id) {
    return resolveClientAlias(id, this.environment.name);
  },
});
