// AI Catalog / ARD manifest advertising the site's MCP server, so agent-readiness
// scanners, ARD registries and MCP clients doing domain-level discovery find it. The same
// body is served at `/.well-known/ard.json` (ARD §5.1, the location consumers MUST fetch)
// and at the predecessor `/.well-known/ai-catalog.json`.
//
// - Catalog: https://ai-catalog.io/spec/ (specVersion "1.0", `entries[]` with
//   `identifier` + `type` + exactly one of `url` / `data`; optional `host`).
// - Entry type naming differs between specs: ai-catalog.io calls it `type`, the
//   Agentic Resource Discovery profile (specification.website) calls it `mediaType`.
//   Both carry the same value; unrecognized entry members are allowed.
// - ARD entry: `representativeQueries` (2-5 natural-language queries) is what a registry
//   builds its semantic index from; Lighthouse's `ard-schema` audit warns without it.
// - Server Card: MCP SEP-2127 / modelcontextprotocol/experimental-ext-server-card
//   `schema.ts` (v1). Embedded inline (`data`) rather than hosted at
//   `<streamable-http-url>/server-card`, so the catalog is self-contained. The card has
//   no auth field — clients discover OAuth at runtime (401 + RFC 9728 metadata on
//   mcp.napochaan.com) — so the hint lives under a reverse-DNS `_meta` key.

import { buildSiteIcons, MCP_ENDPOINT, MCP_SERVER } from '@utils/agent-discovery/facts';

import type { Icon } from '@utils/agent-discovery/facts';

export const AI_CATALOG_MEDIA_TYPE = 'application/ai-catalog+json';
export const MCP_SERVER_CARD_MEDIA_TYPE = 'application/mcp-server-card+json';

const SERVER_CARD_SCHEMA = 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json';

type ServerCard = {
  $schema: typeof SERVER_CARD_SCHEMA;
  name: string;
  version: string;
  title: string;
  description: string;
  websiteUrl: string;
  icons: Icon[];
  remotes: { type: 'streamable-http'; url: string }[];
  _meta: Record<string, unknown>;
};

type CatalogEntry = {
  identifier: string;
  type: typeof MCP_SERVER_CARD_MEDIA_TYPE;
  mediaType: typeof MCP_SERVER_CARD_MEDIA_TYPE;
  displayName: string;
  description: string;
  representativeQueries: string[];
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

// What the owner asks an agent to do through this server (the tools in apps/cms/src/lib/mcp/tools).
const REPRESENTATIVE_QUERIES = [
  'draft a new blog post on napochaan.com',
  'publish or update a napochaan.com blog post',
  'add a work to the napochaan.com portfolio',
  'post a log entry to napochaan.com',
  'upload an image to the napochaan.com CMS',
];

const buildServerCard = (baseUrl: string): ServerCard => ({
  $schema: SERVER_CARD_SCHEMA,
  name: MCP_SERVER.name,
  version: MCP_SERVER.version,
  title: MCP_SERVER.title,
  description: MCP_SERVER.description,
  websiteUrl: baseUrl,
  icons: buildSiteIcons(baseUrl),
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
      displayName: MCP_SERVER.title,
      description: `${MCP_SERVER.description} Owner-only; requires OAuth sign-in.`,
      representativeQueries: REPRESENTATIVE_QUERIES,
      tags: ['mcp', 'cms', 'authoring'],
      data: buildServerCard(baseUrl),
    },
  ],
});
