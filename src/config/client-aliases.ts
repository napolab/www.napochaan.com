type WebpackResolveConfig = { resolve: { alias?: Record<string, string | false> } };

/** Aliases applied only to the browser bundle. `false` tells webpack to resolve
 * the module to an empty object. */
const CLIENT_ALIASES: Record<string, false> = { linkedom: false };

export const applyClientAliases = (config: WebpackResolveConfig, isServer: boolean): void => {
  if (isServer) return;
  config.resolve.alias = { ...(config.resolve.alias ?? {}), ...CLIENT_ALIASES };
};

/** Turbopack equivalent — the `browser` condition only, so server/OG code keeps the
 * real linkedom (OG `clamp-title` runs budoux on the server). */
export const TURBOPACK_RESOLVE_ALIAS = { linkedom: { browser: './src/shims/empty-module.ts' } } as const;
