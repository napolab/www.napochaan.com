// MCP Server Card at `/.well-known/mcp/server-card.json` (SEP-1649 discovery shape, as
// served by isitagentready.com's own card): `serverInfo`, the streamable-HTTP transport
// endpoint and the server's capabilities, plus registry branding (title, description,
// icons). The cms MCP server (apps/cms/src/app/api/mcp/route.ts) registers tools only.
//
// `authentication` is a non-secret hint: the real flow is discovered at runtime from the
// MCP Portal's 401 + RFC 9728 metadata, and auth.md explains it for agents.

import { buildSiteIcons, DISCOVERY_PATHS, MCP_ENDPOINT, MCP_PROTECTED_RESOURCE_METADATA_URL, MCP_SERVER } from '@utils/agent-discovery/facts';

import type { Icon } from '@utils/agent-discovery/facts';

export type MCPServerCard = {
  serverInfo: { name: string; version: string };
  title: string;
  description: string;
  icons: Icon[];
  url: string;
  transport: { type: 'streamable-http'; endpoint: string };
  capabilities: { tools: true };
  authentication: { required: true; schemes: ['oauth2']; protectedResourceMetadata: string; documentation: string };
};

type BuildMCPServerCardArgs = { baseUrl: string };

export const buildMCPServerCard = ({ baseUrl }: BuildMCPServerCardArgs): MCPServerCard => ({
  serverInfo: { name: MCP_SERVER.name, version: MCP_SERVER.version },
  title: MCP_SERVER.title,
  description: MCP_SERVER.description,
  icons: buildSiteIcons(baseUrl),
  url: MCP_ENDPOINT,
  transport: { type: 'streamable-http', endpoint: MCP_ENDPOINT },
  capabilities: { tools: true },
  authentication: {
    required: true,
    schemes: ['oauth2'],
    protectedResourceMetadata: MCP_PROTECTED_RESOURCE_METADATA_URL,
    documentation: `${baseUrl}${DISCOVERY_PATHS.authMarkdown}`,
  },
});
