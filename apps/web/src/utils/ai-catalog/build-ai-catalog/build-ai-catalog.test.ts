import { describe, expect, it } from 'vitest';

import { buildAICatalog, MCP_SERVER_CARD_MEDIA_TYPE } from './index';

const catalog = buildAICatalog({ baseUrl: 'https://napochaan.com' });

const onlyEntry = () => {
  const [entry, ...rest] = catalog.entries;
  expect(rest).toEqual([]);
  if (entry === undefined) throw new Error('catalog has no entry');
  return entry;
};

describe('buildAICatalog', () => {
  it('declares AI Catalog spec version 1.0', () => {
    expect(catalog.specVersion).toBe('1.0');
  });

  it('names the host from the base URL', () => {
    expect(catalog.host).toEqual({ displayName: 'napochaan', identifier: 'napochaan.com', documentationUrl: 'https://napochaan.com/llms.txt' });
  });

  it('follows the deployed host (staging)', () => {
    const staging = buildAICatalog({ baseUrl: 'https://stg.napochaan.com' });
    expect(staging.host.identifier).toBe('stg.napochaan.com');
    expect(staging.host.documentationUrl).toBe('https://stg.napochaan.com/llms.txt');
  });

  it('advertises exactly one MCP server card, typed under both `type` (ai-catalog) and `mediaType` (ARD)', () => {
    const entry = onlyEntry();
    expect(entry.identifier).toBe('urn:air:napochaan.com:mcp:cms');
    expect(entry.type).toBe('application/mcp-server-card+json');
    expect(entry.mediaType).toBe(entry.type);
    expect(MCP_SERVER_CARD_MEDIA_TYPE).toBe('application/mcp-server-card+json');
  });

  it('embeds the server card inline (`data`) and never also links it (`url`)', () => {
    const entry = onlyEntry();
    expect(entry).not.toHaveProperty('url');
    expect(entry.data.$schema).toBe('https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json');
  });

  it('describes the remote streamable-HTTP endpoint behind the MCP Portal', () => {
    expect(onlyEntry().data.remotes).toEqual([{ type: 'streamable-http', url: 'https://mcp.napochaan.com/mcp' }]);
  });

  it('keeps card fields inside the Server Card schema limits', () => {
    const card = onlyEntry().data;
    expect(card.name).toMatch(/^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
    expect(card.description.length).toBeGreaterThan(0);
    expect(card.description.length).toBeLessThanOrEqual(100);
    expect(card.title.length).toBeLessThanOrEqual(100);
    expect(card.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(card.websiteUrl).toBe('https://napochaan.com');
  });

  it('hints that the server needs OAuth under a namespaced `_meta` key (the card schema has no auth field)', () => {
    expect(onlyEntry().data._meta).toEqual({ 'com.napochaan/authorization': { required: true, type: 'oauth2' } });
  });

  it('gives the entry 2 to 5 representative queries so ARD registries can index it (Lighthouse ard-schema warns outside that range)', () => {
    const queries = onlyEntry().representativeQueries;
    expect(queries.length).toBeGreaterThanOrEqual(2);
    expect(queries.length).toBeLessThanOrEqual(5);
    for (const query of queries) {
      expect(query.trim()).not.toBe('');
    }
  });

  it('gives the server card the site icon (absolute URL, PNG, real pixel size)', () => {
    expect(onlyEntry().data.icons).toEqual([{ src: 'https://napochaan.com/icon.png', mimeType: 'image/png', sizes: ['512x512'] }]);
  });

  it('round-trips through JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog);
  });
});
