// AI Catalog (`/.well-known/ai-catalog.json`) advertising the site's MCP server, so
// agent-readiness scanners and MCP clients doing domain-level discovery find it.
//
// - Catalog: https://ai-catalog.io/spec/ (specVersion "1.0", `entries[]` with
//   `identifier` + `type` + exactly one of `url` / `data`; optional `host`).
// - Entry type naming differs between specs: ai-catalog.io calls it `type`, the
//   Agentic Resource Discovery profile (specification.website) calls it `mediaType`.
//   Both carry the same value; unrecognized entry members are allowed.
// - Server Card: MCP SEP-2127 / modelcontextprotocol/experimental-ext-server-card
//   `schema.ts` (v1). Embedded inline (`data`) rather than hosted at
//   `<streamable-http-url>/server-card`, so the catalog is self-contained. The card has
//   no auth field — clients discover OAuth at runtime (401 + RFC 9728 metadata on
//   mcp.napochaan.com) — so the hint lives under a reverse-DNS `_meta` key.

export const AI_CATALOG_MEDIA_TYPE = 'application/ai-catalog+json';
export const MCP_SERVER_CARD_MEDIA_TYPE = 'application/mcp-server-card+json';

const SERVER_CARD_SCHEMA = 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json';

// The MCP Portal in front of the cms Worker's /mcp (docs/mcp-blog-authoring.md).
const MCP_ENDPOINT = 'https://mcp.napochaan.com/mcp';

type ServerCard = {
  $schema: typeof SERVER_CARD_SCHEMA;
  name: string;
  version: string;
  title: string;
  description: string;
  websiteUrl: string;
  remotes: { type: 'streamable-http'; url: string }[];
  _meta: Record<string, unknown>;
};

type CatalogEntry = {
  identifier: string;
  type: typeof MCP_SERVER_CARD_MEDIA_TYPE;
  mediaType: typeof MCP_SERVER_CARD_MEDIA_TYPE;
  displayName: string;
  description: string;
  tags: string[];
  data: ServerCard;
};

export type AICatalog = {
  specVersion: '1.0';
  host: { displayName: string; identifier: string; documentationUrl: string };
  entries: CatalogEntry[];
};

type BuildAICatalogArgs = {
  baseUrl: string;
};

const TITLE = 'napochaan CMS';
// Card `description` is capped at 100 chars by the Server Card schema.
const DESCRIPTION = 'Draft, publish and update napochaan.com blog posts, works and log entries, and upload media.';

const buildServerCard = (baseUrl: string): ServerCard => ({
  $schema: SERVER_CARD_SCHEMA,
  name: 'com.napochaan/cms',
  version: '1.0.0',
  title: TITLE,
  description: DESCRIPTION,
  websiteUrl: baseUrl,
  remotes: [{ type: 'streamable-http', url: MCP_ENDPOINT }],
  _meta: { 'com.napochaan/authorization': { required: true, type: 'oauth2' } },
});

export const buildAICatalog = ({ baseUrl }: BuildAICatalogArgs): AICatalog => ({
  specVersion: '1.0',
  host: { displayName: 'napochaan', identifier: new URL(baseUrl).host, documentationUrl: `${baseUrl}/llms.txt` },
  entries: [
    {
      identifier: 'urn:air:napochaan.com:mcp:cms',
      type: MCP_SERVER_CARD_MEDIA_TYPE,
      mediaType: MCP_SERVER_CARD_MEDIA_TYPE,
      displayName: TITLE,
      description: `${DESCRIPTION} Owner-only; requires OAuth sign-in.`,
      tags: ['mcp', 'cms', 'authoring'],
      data: buildServerCard(baseUrl),
    },
  ],
});
