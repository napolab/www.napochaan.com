import { fetchAuthorizationServerMetadata } from '@lib/authorization-server-metadata/fetch-authorization-server-metadata';
import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';
import { AUTHORIZATION_SERVER } from '@utils/agent-discovery/facts';

import type { AuthorizationServerMetadataFailure } from '@lib/authorization-server-metadata/fetch-authorization-server-metadata';
import type { APIRoute } from 'astro';

// RFC 8414 metadata of the MCP server's authorization server (Cloudflare Access), proxied
// from Access at request time — never written by hand — with `jwks_uri` merged in from
// Access's OpenID configuration. `issuer` stays Access's own.
//
// Cache: the worker's `timeSensitive` policy (edge 1h, TIME_SENSITIVE_PATHS). A CMS purge
// never reaches Access, so the cms policy would freeze a key / endpoint change for a year.
// Any upstream failure answers 502 `no-store` (the Astro handler forces `no-store` on
// every status >= 300 as well), so a failure is never stored.
const badGateway = (failure: AuthorizationServerMetadataFailure): Response => {
  console.error('Authorization server metadata proxy failed', failure);

  return new Response(JSON.stringify({ error: 'bad_gateway', error_description: `The authorization server metadata could not be loaded from ${AUTHORIZATION_SERVER.issuer}.` }), {
    status: 502,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
};

export const GET: APIRoute = async () => (await fetchAuthorizationServerMetadata()).match((metadata) => discoveryJSONResponse(metadata), badGateway);
