import { describe, expect, it } from 'vitest';

import { buildOAuthProtectedResource } from './index';

describe('buildOAuthProtectedResource', () => {
  it('mirrors the MCP Portal PRM (resource + Access issuer) and adds header bearer use and docs', () => {
    expect(buildOAuthProtectedResource({ baseUrl: 'https://napochaan.com' })).toEqual({
      resource: 'https://mcp.napochaan.com',
      resource_name: 'napochaan CMS',
      authorization_servers: ['https://napochaan.cloudflareaccess.com'],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://napochaan.com/auth.md',
    });
  });

  // Cloudflare Access publishes no scopes; inventing them would mislead clients.
  it('does not declare scopes_supported', () => {
    expect(buildOAuthProtectedResource({ baseUrl: 'https://napochaan.com' })).not.toHaveProperty('scopes_supported');
  });

  it('follows the deployed origin for the documentation link (staging)', () => {
    expect(buildOAuthProtectedResource({ baseUrl: 'https://stg.napochaan.com' }).resource_documentation).toBe('https://stg.napochaan.com/auth.md');
  });
});
