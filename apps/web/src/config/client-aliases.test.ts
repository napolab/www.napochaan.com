import { describe, expect, it } from 'vitest';

import { applyClientAliases, TURBOPACK_RESOLVE_ALIAS } from './client-aliases';

describe('applyClientAliases', () => {
  it('maps linkedom to false for the client bundle', () => {
    const config = { resolve: { alias: { existing: './x' } } };
    applyClientAliases(config, false);
    expect(config.resolve.alias).toEqual({ existing: './x', linkedom: false });
  });

  it('leaves the server bundle alone', () => {
    const config = { resolve: { alias: {} } };
    applyClientAliases(config, true);
    expect(config.resolve.alias).toEqual({});
  });

  it('creates resolve.alias when webpack has none', () => {
    const config = { resolve: {} } as { resolve: { alias?: Record<string, string | false> } };
    applyClientAliases(config, false);
    expect(config.resolve.alias).toEqual({ linkedom: false });
  });
});

describe('TURBOPACK_RESOLVE_ALIAS', () => {
  it('points the browser condition of linkedom at the empty shim', () => {
    expect(TURBOPACK_RESOLVE_ALIAS).toEqual({ linkedom: { browser: './src/shims/empty-module.ts' } });
  });
});
