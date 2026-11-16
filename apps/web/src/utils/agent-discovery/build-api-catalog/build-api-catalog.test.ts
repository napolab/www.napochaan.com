import { describe, expect, it } from 'vitest';

import { API_CATALOG_CONTENT_TYPE, buildAPICatalog, LINKSET_MEDIA_TYPE } from './index';

const catalog = buildAPICatalog({ baseUrl: 'https://napochaan.com' });

describe('buildAPICatalog', () => {
  it('is served as an RFC 9727 linkset (application/linkset+json with the api-catalog profile)', () => {
    expect(LINKSET_MEDIA_TYPE).toBe('application/linkset+json');
    expect(API_CATALOG_CONTENT_TYPE).toBe('application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"');
  });

  it('describes the MCP endpoint with its server card and its docs', () => {
    expect(catalog.linkset[0]).toEqual({
      anchor: 'https://mcp.napochaan.com/mcp',
      'service-desc': [{ href: 'https://napochaan.com/.well-known/mcp/server-card.json', type: 'application/json' }],
      'service-doc': [
        { href: 'https://napochaan.com/auth.md', type: 'text/markdown' },
        { href: 'https://napochaan.com/llms.txt', type: 'text/plain' },
      ],
    });
  });

  it('lists the catalog itself with the MCP endpoint as its item (RFC 9727 §4.2)', () => {
    expect(catalog.linkset[1]).toEqual({ anchor: 'https://napochaan.com/.well-known/api-catalog', item: [{ href: 'https://mcp.napochaan.com/mcp' }] });
    expect(catalog.linkset).toHaveLength(2);
  });

  it('follows the deployed origin (staging)', () => {
    const staging = buildAPICatalog({ baseUrl: 'https://stg.napochaan.com' });
    expect(staging.linkset[1]?.anchor).toBe('https://stg.napochaan.com/.well-known/api-catalog');
  });
});
