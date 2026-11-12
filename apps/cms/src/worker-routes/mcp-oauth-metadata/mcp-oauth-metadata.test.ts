import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { createMCPOAuthMetadataRoutes, resolveMCPAccessIssuer, toProtectedResourceMetadata } from './index';

import type { MCPOAuthMetadataFetcher } from './index';

const CONFIGURED = { CF_ACCESS_TEAM_DOMAIN: 'napochaan', CF_ACCESS_MCP_AUD: 'aud-1' };
const ISSUER = 'https://napochaan.cloudflareaccess.com';
const PRM_PATH = '/.well-known/oauth-protected-resource/mcp';
const AS_PATH = '/.well-known/oauth-authorization-server';
const UPSTREAM_METADATA = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/cdn-cgi/access/oauth/authorization`,
  token_endpoint: `${ISSUER}/cdn-cgi/access/oauth/token`,
  registration_endpoint: `${ISSUER}/cdn-cgi/access/oauth/registration`,
};

const upstreamReturning = (response: Response) => vi.fn<MCPOAuthMetadataFetcher>(async () => response);

// 未設定時の fall through を観測するため、後ろに catch-all を置いた親 app に載せる。
const createApp = (fetcher: MCPOAuthMetadataFetcher = upstreamReturning(Response.json(UPSTREAM_METADATA))) =>
  new Hono().route('/', createMCPOAuthMetadataRoutes({ fetcher })).all('*', (c) => c.text('fallthrough', 404));

describe('resolveMCPAccessIssuer', () => {
  it('returns the team issuer when the team and the MCP AUD are configured', () => {
    expect(resolveMCPAccessIssuer(CONFIGURED)).toBe(ISSUER);
  });

  it('normalizes the team domain the same way the MCP route does', () => {
    expect(resolveMCPAccessIssuer({ ...CONFIGURED, CF_ACCESS_TEAM_DOMAIN: 'https://NapoChaan.cloudflareaccess.com/' })).toBe(ISSUER);
  });

  it.each([
    ['missing team', { CF_ACCESS_MCP_AUD: 'aud-1' }],
    ['blank team', { ...CONFIGURED, CF_ACCESS_TEAM_DOMAIN: '  ' }],
    ['malformed team', { ...CONFIGURED, CF_ACCESS_TEAM_DOMAIN: 'not a team!' }],
    ['missing MCP AUD', { CF_ACCESS_TEAM_DOMAIN: 'napochaan' }],
    ['empty MCP AUD', { ...CONFIGURED, CF_ACCESS_MCP_AUD: ' , ' }],
  ])('is undefined for %s', (_, env) => {
    expect(resolveMCPAccessIssuer(env)).toBeUndefined();
  });
});

describe('toProtectedResourceMetadata', () => {
  it('points the resource at <origin>/mcp and the authorization server at the issuer', () => {
    expect(toProtectedResourceMetadata('https://stg.napochaan.com', ISSUER)).toEqual({
      resource: 'https://stg.napochaan.com/mcp',
      authorization_servers: [ISSUER],
    });
  });
});

describe('createMCPOAuthMetadataRoutes', () => {
  describe(`GET ${PRM_PATH}`, () => {
    it('serves the protected resource metadata for the request origin', async () => {
      const response = await createApp().request(`https://stg.napochaan.com${PRM_PATH}`, {}, CONFIGURED);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      expect(await response.json()).toEqual({ resource: 'https://stg.napochaan.com/mcp', authorization_servers: [ISSUER] });
    });
  });

  describe(`GET ${AS_PATH}`, () => {
    it('proxies the team authorization server metadata unchanged', async () => {
      const fetcher = upstreamReturning(Response.json(UPSTREAM_METADATA, { headers: { 'Cache-Control': 'private' } }));

      const response = await createApp(fetcher).request(`https://stg.napochaan.com${AS_PATH}`, {}, CONFIGURED);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      expect(await response.json()).toEqual(UPSTREAM_METADATA);
      expect(fetcher).toHaveBeenCalledOnce();
      expect(new URL(`${fetcher.mock.calls[0]?.[0] ?? 'http://invalid'}`).href).toBe(`${ISSUER}${AS_PATH}`);
    });

    it('answers 502 no-store when the upstream is not 2xx', async () => {
      const response = await createApp(upstreamReturning(new Response('boom', { status: 500 }))).request(AS_PATH, {}, CONFIGURED);

      expect(response.status).toBe(502);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('answers 502 no-store when the upstream body is not JSON', async () => {
      const response = await createApp(upstreamReturning(new Response('<html></html>', { status: 200 }))).request(AS_PATH, {}, CONFIGURED);

      expect(response.status).toBe(502);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('answers 502 no-store when the upstream fetch rejects', async () => {
      const fetcher = vi.fn<MCPOAuthMetadataFetcher>(async () => {
        throw new TypeError('network down');
      });

      const response = await createApp(fetcher).request(AS_PATH, {}, CONFIGURED);

      expect(response.status).toBe(502);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  describe.each([PRM_PATH, AS_PATH])('when MCP Access is not configured (%s)', (path) => {
    it.each([
      ['missing team', { CF_ACCESS_MCP_AUD: 'aud-1' }],
      ['malformed team', { ...CONFIGURED, CF_ACCESS_TEAM_DOMAIN: 'not a team!' }],
      ['empty MCP AUD', { ...CONFIGURED, CF_ACCESS_MCP_AUD: '' }],
    ])('falls through for %s and never calls the upstream', async (_, env) => {
      const fetcher = upstreamReturning(Response.json(UPSTREAM_METADATA));

      const response = await createApp(fetcher).request(path, {}, env);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('fallthrough');
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  it.each(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/other', '/.well-known/openid-configuration'])('leaves %s to the next handler', async (path) => {
    const fetcher = upstreamReturning(Response.json(UPSTREAM_METADATA));

    const response = await createApp(fetcher).request(path, {}, CONFIGURED);

    expect(await response.text()).toBe('fallthrough');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('leaves non-GET methods to the next handler', async () => {
    const response = await createApp().request(PRM_PATH, { method: 'POST' }, CONFIGURED);

    expect(await response.text()).toBe('fallthrough');
  });
});
