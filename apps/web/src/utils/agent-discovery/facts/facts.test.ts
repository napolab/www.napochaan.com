import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { AUTHORIZATION_SERVER, buildSiteIcons, DISCOVERY_PATHS, MCP_ENDPOINT, MCP_RESOURCE, MCP_SERVER, SITE_ICON } from './index';

const WEB_ROOT = path.resolve(import.meta.dirname, '../../../..');

// PNG: 8-byte signature, then the IHDR chunk (length, type) whose data starts with
// width and height as big-endian uint32 at byte offsets 16 and 20.
const readPNGSize = (file: string): string => {
  const bytes = readFileSync(file);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
};

describe('agent discovery facts', () => {
  it('puts the MCP endpoint under the protected resource identifier on the MCP Portal host', () => {
    expect(MCP_RESOURCE).toBe('https://mcp.napochaan.com');
    expect(MCP_ENDPOINT).toBe('https://mcp.napochaan.com/mcp');
  });

  it('names Cloudflare Access managed OAuth as the authorization server', () => {
    expect(AUTHORIZATION_SERVER.issuer).toBe('https://napochaan.cloudflareaccess.com');
    expect(AUTHORIZATION_SERVER.metadataURL).toBe('https://napochaan.cloudflareaccess.com/.well-known/oauth-authorization-server');
    expect(AUTHORIZATION_SERVER.openIDConfigurationURL).toBe('https://napochaan.cloudflareaccess.com/.well-known/openid-configuration');
  });

  it('keeps every authorization server endpoint on the issuer origin', () => {
    const { issuer, metadataURL, openIDConfigurationURL, ...endpoints } = AUTHORIZATION_SERVER;
    for (const endpoint of [metadataURL, openIDConfigurationURL, ...Object.values(endpoints)]) {
      expect(endpoint.startsWith(`${issuer}/`)).toBe(true);
    }
  });

  it('keeps the server description inside the Server Card schema limit (100 chars)', () => {
    expect(MCP_SERVER.title).toBe('napochaan CMS');
    expect(MCP_SERVER.description.length).toBeGreaterThan(0);
    expect(MCP_SERVER.description.length).toBeLessThanOrEqual(100);
  });

  it('declares the site icon with the real pixel size of public/icon.png', () => {
    expect(SITE_ICON.sizes).toEqual([readPNGSize(path.join(WEB_ROOT, 'public', SITE_ICON.path))]);
  });

  // Astro routes are files: `/a/b.json` is served by `src/pages/a/b.json.ts`. A renamed or
  // missing route would leave every document that links the path pointing at a 404.
  it.each(Object.entries(DISCOVERY_PATHS))('serves the %s path (%s) from a route file', (_name, pathname) => {
    expect(existsSync(path.join(WEB_ROOT, 'src', 'pages', `${pathname}.ts`))).toBe(true);
  });

  it('builds absolute icon URLs on the deployed origin', () => {
    expect(buildSiteIcons('https://stg.napochaan.com')).toEqual([{ src: 'https://stg.napochaan.com/icon.png', mimeType: 'image/png', sizes: ['512x512'] }]);
  });
});
