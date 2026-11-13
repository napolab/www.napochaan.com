import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CLIENT_ALIASES, resolveClientAlias } from './index';

describe('resolveClientAlias', () => {
  it('maps linkedom to the browser shim in the client environment', () => {
    expect(resolveClientAlias('linkedom', 'client')).toBe(CLIENT_ALIASES.linkedom);
  });

  it('leaves linkedom alone on the server (OG clamp-title runs budoux there)', () => {
    expect(resolveClientAlias('linkedom', 'server')).toBeUndefined();
  });

  it('ignores other modules', () => {
    expect(resolveClientAlias('react', 'client')).toBeUndefined();
  });

  it('points at src/shims/linkedom-browser.ts', () => {
    expect(path.relative(path.resolve(import.meta.dirname, '../../..'), CLIENT_ALIASES.linkedom)).toBe(path.join('src', 'shims', 'linkedom-browser.ts'));
  });
});
