import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAuthorizationServerMetadata } from './fetch-authorization-server-metadata';

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

type Upstream = Record<string, () => Response | Promise<Response>>;

const stubUpstream = (routes: Upstream) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : `${input}`;
    const route = routes[url];
    if (route === undefined) throw new Error(`unexpected fetch ${url}`);
    return route();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const healthy: Upstream = { [AS_URL]: () => Response.json(AS_METADATA), [OIDC_URL]: () => Response.json(OIDC_CONFIGURATION) };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAuthorizationServerMetadata', () => {
  it('fetches both Access documents and merges jwks_uri into the AS metadata', async () => {
    const fetchMock = stubUpstream(healthy);
    const result = await fetchAuthorizationServerMetadata();
    expect(result._unsafeUnwrap()).toEqual({ ...AS_METADATA, jwks_uri: OIDC_CONFIGURATION.jwks_uri });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('starts both requests before either answers (parallel)', async () => {
    const pending: Array<() => void> = [];
    const waitThen = (body: unknown) => () => new Promise<Response>((resolve) => pending.push(() => resolve(Response.json(body))));
    const fetchMock = stubUpstream({ [AS_URL]: waitThen(AS_METADATA), [OIDC_URL]: waitThen(OIDC_CONFIGURATION) });
    const result = fetchAuthorizationServerMetadata();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    for (const release of pending) release();
    expect((await result).isOk()).toBe(true);
  });

  it('fails on a non-2xx upstream', async () => {
    stubUpstream({ ...healthy, [OIDC_URL]: () => new Response('nope', { status: 503 }) });
    expect((await fetchAuthorizationServerMetadata())._unsafeUnwrapErr()).toEqual({ kind: 'upstream_status', url: OIDC_URL, status: 503 });
  });

  it('fails when upstream is unreachable', async () => {
    stubUpstream({ ...healthy, [AS_URL]: () => Promise.reject(new TypeError('network down')) });
    expect((await fetchAuthorizationServerMetadata())._unsafeUnwrapErr()).toEqual({ kind: 'upstream_unreachable', url: AS_URL });
  });

  it('fails on a body that is not JSON', async () => {
    stubUpstream({ ...healthy, [AS_URL]: () => new Response('<html>', { headers: { 'content-type': 'text/html' } }) });
    expect((await fetchAuthorizationServerMetadata())._unsafeUnwrapErr()).toEqual({ kind: 'invalid_json', url: AS_URL });
  });

  it('fails on JSON that is not the expected document', async () => {
    stubUpstream({ ...healthy, [OIDC_URL]: () => Response.json({ issuer: ISSUER }) });
    expect((await fetchAuthorizationServerMetadata())._unsafeUnwrapErr()).toEqual({ kind: 'invalid_document', url: OIDC_URL });
  });

  it('fails when the documents name another issuer', async () => {
    stubUpstream({ ...healthy, [OIDC_URL]: () => Response.json({ ...OIDC_CONFIGURATION, issuer: 'https://evil.example' }) });
    expect((await fetchAuthorizationServerMetadata())._unsafeUnwrapErr()).toEqual({ kind: 'issuer_mismatch', expected: ISSUER, actual: 'https://evil.example' });
  });
});
