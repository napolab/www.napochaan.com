import { describe, expect, it } from 'vitest';

import { buildMCPServerCard } from './index';

const card = buildMCPServerCard({ baseUrl: 'https://napochaan.com' });

describe('buildMCPServerCard', () => {
  it('names the server in serverInfo (name + version), as the scanner requires', () => {
    expect(card.serverInfo).toEqual({ name: 'com.napochaan/cms', version: '1.0.0' });
  });

  it('carries the registry branding: title, description and an absolute icon', () => {
    expect(card.title).toBe('napochaan CMS');
    expect(card.description).toBe('Draft, publish and update napochaan.com blog posts, works and log entries, and upload media.');
    expect(card.icons).toEqual([{ src: 'https://napochaan.com/icon.png', mimeType: 'image/png', sizes: ['512x512'] }]);
  });

  it('points at the streamable-HTTP endpoint behind the MCP Portal', () => {
    expect(card.url).toBe('https://mcp.napochaan.com/mcp');
    expect(card.transport).toEqual({ type: 'streamable-http', endpoint: 'https://mcp.napochaan.com/mcp' });
  });

  // apps/cms/src/app/api/mcp/route.ts registers tools only (no resources / prompts).
  it('declares only the capabilities the server registers', () => {
    expect(card.capabilities).toEqual({ tools: true });
  });

  it('hints that OAuth is required and where its metadata lives, with no secrets', () => {
    expect(card.authentication).toEqual({
      required: true,
      schemes: ['oauth2'],
      protectedResourceMetadata: 'https://mcp.napochaan.com/.well-known/oauth-protected-resource',
      documentation: 'https://napochaan.com/auth.md',
    });
  });

  it('follows the deployed origin for site-relative links (staging)', () => {
    const staging = buildMCPServerCard({ baseUrl: 'https://stg.napochaan.com' });
    expect(staging.icons[0]?.src).toBe('https://stg.napochaan.com/icon.png');
    expect(staging.authentication.documentation).toBe('https://stg.napochaan.com/auth.md');
  });
});
