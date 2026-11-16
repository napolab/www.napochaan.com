// API Catalog (`/.well-known/api-catalog`, RFC 9727): an RFC 9264 linkset listing the
// site's APIs. The only API is the owner-only MCP authoring server; its machine-readable
// description is the MCP Server Card and its human/agent docs are auth.md and llms.txt.
// RFC 9727 §4.2 also lists the catalog itself, with each API as an `item`.

import { DISCOVERY_PATHS, MCP_ENDPOINT } from '@utils/agent-discovery/facts';

export const LINKSET_MEDIA_TYPE = 'application/linkset+json';

// RFC 9727 §4: the linkset media type, optionally with the api-catalog profile parameter.
export const API_CATALOG_CONTENT_TYPE = `${LINKSET_MEDIA_TYPE}; profile="https://www.rfc-editor.org/info/rfc9727"`;

type Link = { href: string; type?: string };

type ServiceContext = { anchor: string; 'service-desc': Link[]; 'service-doc': Link[] };

type CatalogContext = { anchor: string; item: Link[] };

export type APICatalog = { linkset: [ServiceContext, CatalogContext] };

type BuildAPICatalogArgs = { baseUrl: string };

const buildMCPService = (baseUrl: string): ServiceContext => ({
  anchor: MCP_ENDPOINT,
  'service-desc': [{ href: `${baseUrl}${DISCOVERY_PATHS.mcpServerCard}`, type: 'application/json' }],
  'service-doc': [
    { href: `${baseUrl}${DISCOVERY_PATHS.authMarkdown}`, type: 'text/markdown' },
    { href: `${baseUrl}${DISCOVERY_PATHS.llmsTxt}`, type: 'text/plain' },
  ],
});

const buildCatalogSelf = (baseUrl: string): CatalogContext => ({ anchor: `${baseUrl}${DISCOVERY_PATHS.apiCatalog}`, item: [{ href: MCP_ENDPOINT }] });

export const buildAPICatalog = ({ baseUrl }: BuildAPICatalogArgs): APICatalog => ({ linkset: [buildMCPService(baseUrl), buildCatalogSelf(baseUrl)] });
