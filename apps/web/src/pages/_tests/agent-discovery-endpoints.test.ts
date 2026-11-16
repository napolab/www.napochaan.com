import { afterEach, describe, expect, it, vi } from 'vitest';

import * as agentSkillsIndexJSON from '../.well-known/agent-skills/index.json';
import * as readSiteSkillMarkdown from '../.well-known/agent-skills/read-napochaan-com/SKILL.md';
import * as aiCatalogJSON from '../.well-known/ai-catalog.json';
import * as apiCatalog from '../.well-known/api-catalog';
import * as ardJSON from '../.well-known/ard.json';
import * as mcpServerCardJSON from '../.well-known/mcp/server-card.json';
import * as oauthAuthorizationServer from '../.well-known/oauth-authorization-server';
import * as oauthProtectedResource from '../.well-known/oauth-protected-resource';
import * as poppyJSON from '../.well-known/poppy.json';
import * as authMarkdown from '../auth.md';
import { renderEndpoint } from '../../test-utils/astro-container';
import { buildAPICatalog } from '@utils/agent-discovery/build-api-catalog';
import { buildAuthMarkdown } from '@utils/agent-discovery/build-auth-markdown';
import { buildMCPServerCard } from '@utils/agent-discovery/build-mcp-server-card';
import { buildOAuthProtectedResource } from '@utils/agent-discovery/build-oauth-protected-resource';
import { buildPoppyDiscovery } from '@utils/agent-discovery/build-poppy-discovery';
import { buildReadSiteSkill, READ_SITE_SKILL } from '@utils/agent-discovery/build-read-site-skill';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const BASE_URL = 'https://napochaan.com';

const asEndpoint = (mod: unknown) => mod as AstroComponentFactory;

const render = async (mod: unknown, pathname: string, init: RequestInit = {}) => {
  vi.stubEnv('BASE_URL', BASE_URL);
  return renderEndpoint(asEndpoint(mod), pathname, {}, init);
};

const ISSUER = 'https://napochaan.cloudflareaccess.com';
const AS_URL = `${ISSUER}/.well-known/oauth-authorization-server`;
const OIDC_URL = `${ISSUER}/.well-known/openid-configuration`;
const AS_METADATA = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/cdn-cgi/access/oauth/authorization`,
  token_endpoint: `${ISSUER}/cdn-cgi/access/oauth/token`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
};
const OIDC_CONFIGURATION = { issuer: ISSUER, jwks_uri: `${ISSUER}/cdn-cgi/access/certs` };

// Cloudflare Access, faked at the fetch boundary; `overrides` replace single documents.
const stubAccess = (overrides: Record<string, () => Response>) => {
  const routes: Record<string, () => Response> = { [AS_URL]: () => Response.json(AS_METADATA), ...overrides };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const route = routes[input instanceof Request ? input.url : `${input}`];
      if (route === undefined) throw new Error('unexpected fetch');
      return route();
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('static agent-discovery JSON endpoints', () => {
  it('/.well-known/ard.json serves the same manifest as /.well-known/ai-catalog.json', async () => {
    const ard = await render(ardJSON, '/.well-known/ard.json');
    const legacy = await render(aiCatalogJSON, '/.well-known/ai-catalog.json');
    expect(ard.status).toBe(200);
    expect(ard.headers.get('content-type')).toBe('application/ai-catalog+json');
    expect(ard.headers.get('access-control-allow-origin')).toBe('*');
    expect(await ard.text()).toBe(await legacy.text());
  });

  it('/.well-known/mcp/server-card.json', async () => {
    const res = await render(mcpServerCardJSON, '/.well-known/mcp/server-card.json');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual(buildMCPServerCard({ baseUrl: BASE_URL }));
  });

  it('/.well-known/api-catalog is an RFC 9727 linkset', async () => {
    const res = await render(apiCatalog, '/.well-known/api-catalog');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual(buildAPICatalog({ baseUrl: BASE_URL }));
  });

  // RFC 9727 §2: the catalog SHOULD answer HEAD as well (Astro answers HEAD with the GET handler).
  it('/.well-known/api-catalog answers HEAD with the same headers and no body', async () => {
    const res = await render(apiCatalog, '/.well-known/api-catalog', { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"');
    expect(await res.text()).toBe('');
  });

  it('/.well-known/oauth-protected-resource', async () => {
    const res = await render(oauthProtectedResource, '/.well-known/oauth-protected-resource');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual(buildOAuthProtectedResource({ baseUrl: BASE_URL }));
  });

  it('/.well-known/oauth-authorization-server proxies Access metadata with jwks_uri merged in', async () => {
    stubAccess({ [OIDC_URL]: () => Response.json(OIDC_CONFIGURATION) });
    const res = await render(oauthAuthorizationServer, '/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual({ ...AS_METADATA, jwks_uri: OIDC_CONFIGURATION.jwks_uri });
  });

  // 502 is forced to `no-store` by the worker's Astro handler too; the route says so itself.
  it('/.well-known/oauth-authorization-server answers 502 (never cached) when upstream fails', async () => {
    stubAccess({ [OIDC_URL]: () => new Response('down', { status: 503 }) });
    const res = await render(oauthAuthorizationServer, '/.well-known/oauth-authorization-server');
    expect(res.status).toBe(502);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ error: 'bad_gateway', error_description: 'The authorization server metadata could not be loaded from https://napochaan.cloudflareaccess.com.' });
  });

  it('/auth.md is Markdown served at the site root', async () => {
    const res = await render(authMarkdown, '/auth.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe(buildAuthMarkdown({ baseUrl: BASE_URL }));
  });

  it('/.well-known/agent-skills/index.json lists the read-napochaan-com skill', async () => {
    const res = await render(agentSkillsIndexJSON, '/.well-known/agent-skills/index.json');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual({
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: [
        {
          name: 'read-napochaan-com',
          type: 'skill-md',
          description: READ_SITE_SKILL.description,
          url: 'https://napochaan.com/.well-known/agent-skills/read-napochaan-com/SKILL.md',
          digest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
        },
      ],
    });
  });

  it('/.well-known/agent-skills/read-napochaan-com/SKILL.md is Markdown', async () => {
    const res = await render(readSiteSkillMarkdown, '/.well-known/agent-skills/read-napochaan-com/SKILL.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe(buildReadSiteSkill({ baseUrl: BASE_URL }));
  });

  // The index digest must be the SHA-256 of the exact bytes the SKILL.md route serves.
  it('advertises the SHA-256 of the served SKILL.md bytes in the index', async () => {
    const index = await (await render(agentSkillsIndexJSON, '/.well-known/agent-skills/index.json')).json();
    const served = await (await render(readSiteSkillMarkdown, '/.well-known/agent-skills/read-napochaan-com/SKILL.md')).arrayBuffer();
    const hex = [...new Uint8Array(await crypto.subtle.digest('SHA-256', served))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    expect(index).toMatchObject({ skills: [{ digest: `sha256:${hex}` }] });
  });

  it('/.well-known/poppy.json', async () => {
    const res = await render(poppyJSON, '/.well-known/poppy.json');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual(buildPoppyDiscovery({ baseUrl: BASE_URL }));
  });
});
