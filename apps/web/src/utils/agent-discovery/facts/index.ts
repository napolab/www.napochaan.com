// Facts about the site's MCP authoring server and its authorization server, shared by every
// agent-discovery document (AI Catalog / ARD, MCP Server Card, API Catalog, OAuth metadata,
// auth.md, Agent Skills). Each URL is written once here so the documents cannot disagree.
//
// - MCP: the Cloudflare MCP Portal in front of the cms Worker's /mcp
//   (docs/mcp-blog-authoring.md). Its RFC 9728 metadata lives at
//   `${MCP_RESOURCE}/.well-known/oauth-protected-resource`.
// - Authorization server: Cloudflare Access managed OAuth (docs/cloudflare-access.md). The
//   endpoint paths are the ones Access publishes in its RFC 8414 metadata.

// RFC 9728 resource identifier of the MCP Portal (what its own PRM document declares).
export const MCP_RESOURCE = 'https://mcp.napochaan.com';

export const MCP_ENDPOINT = `${MCP_RESOURCE}/mcp`;

export const MCP_PROTECTED_RESOURCE_METADATA_URL = `${MCP_RESOURCE}/.well-known/oauth-protected-resource`;

const ISSUER = 'https://napochaan.cloudflareaccess.com';

export const AUTHORIZATION_SERVER = {
  issuer: ISSUER,
  metadataURL: `${ISSUER}/.well-known/oauth-authorization-server`,
  openIDConfigurationURL: `${ISSUER}/.well-known/openid-configuration`,
  authorizationEndpoint: `${ISSUER}/cdn-cgi/access/oauth/authorization`,
  tokenEndpoint: `${ISSUER}/cdn-cgi/access/oauth/token`,
  registrationEndpoint: `${ISSUER}/cdn-cgi/access/oauth/registration`,
  revocationEndpoint: `${ISSUER}/cdn-cgi/access/oauth/revoke`,
} as const;

// Identity of the MCP server as advertised in discovery documents. `name` is the
// reverse-DNS Server Card name; the `description` is capped at 100 chars by that schema.
export const MCP_SERVER = {
  name: 'com.napochaan/cms',
  version: '1.0.0',
  title: 'napochaan CMS',
  description: 'Draft, publish and update napochaan.com blog posts, works and log entries, and upload media.',
} as const;

// Root-relative paths of this site's machine-readable discovery documents. facts.test.ts
// asserts each one has its `src/pages/<path>.ts` route.
export const DISCOVERY_PATHS = {
  llmsTxt: '/llms.txt',
  llmsFullTxt: '/llms-full.txt',
  sitemap: '/sitemap.xml',
  authMarkdown: '/auth.md',
  aiCatalog: '/.well-known/ai-catalog.json',
  ard: '/.well-known/ard.json',
  apiCatalog: '/.well-known/api-catalog',
  mcpServerCard: '/.well-known/mcp/server-card.json',
  oauthProtectedResource: '/.well-known/oauth-protected-resource',
  oauthAuthorizationServer: '/.well-known/oauth-authorization-server',
  agentSkillsIndex: '/.well-known/agent-skills/index.json',
  poppy: '/.well-known/poppy.json',
} as const;

// `public/icon.png` (served by Workers Static Assets). `sizes` is pinned to the file's
// real pixel size by facts.test.ts.
export const SITE_ICON = { path: '/icon.png', mimeType: 'image/png', sizes: ['512x512'] } as const;

export type Icon = { src: string; mimeType: string; sizes: string[] };

export const buildSiteIcons = (baseUrl: string): Icon[] => [{ src: `${baseUrl}${SITE_ICON.path}`, mimeType: SITE_ICON.mimeType, sizes: [...SITE_ICON.sizes] }];
