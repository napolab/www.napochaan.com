// OAuth 2.0 Protected Resource Metadata (RFC 9728) for the MCP authoring server, served at
// this site's `/.well-known/oauth-protected-resource`. It mirrors the document the MCP
// Portal publishes at https://mcp.napochaan.com/.well-known/oauth-protected-resource
// (`resource` + `authorization_servers`) and adds the RFC 9728 fields that describe how
// the token is presented and where the docs are. No `scopes_supported`: Cloudflare Access
// publishes none, and an invented list would mislead clients.

import { AUTHORIZATION_SERVER, DISCOVERY_PATHS, MCP_RESOURCE, MCP_SERVER } from '@utils/agent-discovery/facts';

export type OAuthProtectedResource = {
  resource: string;
  resource_name: string;
  authorization_servers: string[];
  bearer_methods_supported: ['header'];
  resource_documentation: string;
};

type BuildOAuthProtectedResourceArgs = { baseUrl: string };

export const buildOAuthProtectedResource = ({ baseUrl }: BuildOAuthProtectedResourceArgs): OAuthProtectedResource => ({
  resource: MCP_RESOURCE,
  resource_name: MCP_SERVER.title,
  authorization_servers: [AUTHORIZATION_SERVER.issuer],
  bearer_methods_supported: ['header'],
  resource_documentation: `${baseUrl}${DISCOVERY_PATHS.authMarkdown}`,
});
