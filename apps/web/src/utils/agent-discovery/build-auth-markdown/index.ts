// `/auth.md`: how an agent authenticates against this site (Auth.md agent registration
// discovery). Cloudflare Access's AS metadata carries no `agent_auth` block, so the
// document is self-contained: audience, protected resource, discovery URLs, registration,
// supported method, credential use, revocation and what is not supported. Every URL comes
// from `@utils/agent-discovery/facts`. Written in English for agents.

import { AUTHORIZATION_SERVER, DISCOVERY_PATHS, MCP_ENDPOINT, MCP_PROTECTED_RESOURCE_METADATA_URL, MCP_RESOURCE } from '@utils/agent-discovery/facts';

type BuildAuthMarkdownArgs = { baseUrl: string };

const audience = (baseUrl: string): string[] => [
  '## Audience',
  '',
  `- **Readers (any agent)**: No authentication is needed to read napochaan.com. Pages, their Markdown representations, [llms.txt](${baseUrl}${DISCOVERY_PATHS.llmsTxt}), feeds and the [sitemap](${baseUrl}${DISCOVERY_PATHS.sitemap}) are public. Send no credentials.`,
  '- **Authors**: the MCP authoring server below drafts, publishes and updates site content. Only the site owner can obtain credentials for it: sign-in goes through Cloudflare Access, which admits the owner’s identity only. An agent acting for anyone else cannot obtain a usable token.',
];

const protectedResource = (): string[] => [
  '## Protected resource',
  '',
  `- Resource identifier: \`${MCP_RESOURCE}\``,
  `- MCP endpoint (Streamable HTTP): \`${MCP_ENDPOINT}\``,
  '- Requests without a valid access token are rejected.',
];

const discovery = (baseUrl: string): string[] => [
  '## Discovery',
  '',
  `- Protected Resource Metadata (RFC 9728): ${MCP_PROTECTED_RESOURCE_METADATA_URL} (mirrored at ${baseUrl}${DISCOVERY_PATHS.oauthProtectedResource})`,
  `- Authorization Server Metadata (RFC 8414): ${AUTHORIZATION_SERVER.metadataURL} (proxied with \`jwks_uri\` at ${baseUrl}${DISCOVERY_PATHS.oauthAuthorizationServer})`,
  `- OpenID configuration (signing keys, \`jwks_uri\`): ${AUTHORIZATION_SERVER.openIDConfigurationURL}`,
  `- MCP Server Card: ${baseUrl}${DISCOVERY_PATHS.mcpServerCard}`,
  `- API Catalog (RFC 9727): ${baseUrl}${DISCOVERY_PATHS.apiCatalog}`,
];

const authorizationServer = (): string[] => [
  '## Authorization server',
  '',
  `- Issuer: \`${AUTHORIZATION_SERVER.issuer}\` (Cloudflare Access managed OAuth)`,
  `- Authorization endpoint: \`${AUTHORIZATION_SERVER.authorizationEndpoint}\``,
  `- Token endpoint: \`${AUTHORIZATION_SERVER.tokenEndpoint}\``,
];

const registration = (): string[] => [
  '## Registration',
  '',
  `Register a client with OAuth 2.0 Dynamic Client Registration (RFC 7591) by POSTing its client metadata to \`${AUTHORIZATION_SERVER.registrationEndpoint}\` (the \`registration_endpoint\` of the authorization server metadata). Public clients (\`token_endpoint_auth_method: none\`) are accepted, as are \`client_secret_basic\` and \`client_secret_post\`. Redirect URIs must be allowed by the Cloudflare Access configuration.`,
];

const supportedMethod = (): string[] => [
  '## Supported method',
  '',
  '- Grant: `authorization_code` with PKCE (`code_challenge_method` `S256` only), `response_type` `code`.',
  '- Refresh: `refresh_token` at the token endpoint.',
  '- Sign-in: the authorization endpoint hands the user to Cloudflare Access, where the site owner signs in with their own identity. There is no password or API key to enter.',
  '- Scopes: the authorization server metadata publishes none (`scopes_supported` is absent).',
];

const credentialUse = (): string[] => [
  '## Using the credential',
  '',
  `Send the access token in the \`Authorization\` header of every request to the MCP endpoint (header only, never in a query string):`,
  '',
  '```http',
  `POST ${MCP_ENDPOINT}`,
  'Authorization: Bearer <access_token>',
  '```',
];

const revocation = (): string[] => [
  '## Revocation',
  '',
  `Revoke access and refresh tokens at \`${AUTHORIZATION_SERVER.revocationEndpoint}\` (RFC 7009). The owner can also end the session from Cloudflare Access.`,
];

const unsupported = (): string[] => [
  '## Not supported',
  '',
  '- Anonymous agent registration.',
  '- Identity assertion (ID-JAG, `urn:ietf:params:oauth:token-type:id-jag`) registration.',
  '- Verified-email agent registration.',
  '- API keys or other static credentials.',
];

export const buildAuthMarkdown = ({ baseUrl }: BuildAuthMarkdownArgs): string =>
  [
    ['# napochaan.com auth.md', '', 'How AI agents and MCP clients authenticate with napochaan.com.'],
    audience(baseUrl),
    protectedResource(),
    discovery(baseUrl),
    authorizationServer(),
    registration(),
    supportedMethod(),
    credentialUse(),
    revocation(),
    unsupported(),
  ]
    .map((section) => section.join('\n'))
    .join('\n\n')
    .concat('\n');
