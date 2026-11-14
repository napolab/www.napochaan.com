import type { Metadata } from '../metadata';

// RFC 8288 `Link` response header for an HTML page, so agents can discover the
// machine-readable resources without parsing the markup (isitagentready.com
// "Link response headers"; it reads the homepage and scores registered rels such as
// `describedby`). Built from the same `alternates.types` that `seo.astro` renders as
// `<link rel="alternate">`, so header and markup never disagree.
//
// Must be set from the page frontmatter (`Astro.response.headers`): the page response
// is created before the layout renders under streaming, so a header set in the layout
// would be dropped.
//
// Targets stay root-relative (RFC 8288 resolves them against the request URL) and are
// percent-encoded: `Headers.set` throws on non-Latin-1, and a CMS slug can be Japanese.
// Titles are left out for the same reason.

type LinkTarget = { url: string; rel: string; type: string };

// Site-wide discovery targets, on every page (the homepage has no markdown twin).
const SITE_LINKS: readonly LinkTarget[] = [
  { url: '/llms.txt', rel: 'describedby', type: 'text/plain' },
  { url: '/sitemap.xml', rel: 'sitemap', type: 'application/xml' },
];

const alternateLinks = (metadata: Partial<Pick<Metadata, 'alternates'>>): LinkTarget[] =>
  Object.entries(metadata.alternates?.types ?? {}).flatMap(([type, links]) => links.map((link) => ({ url: link.url, rel: 'alternate', type })));

const formatLink = ({ url, rel, type }: LinkTarget): string => `<${encodeURI(url)}>; rel="${rel}"; type="${type}"`;

export const buildLinkHeader = (metadata: Partial<Pick<Metadata, 'alternates'>>): string => [...alternateLinks(metadata), ...SITE_LINKS].map(formatLink).join(', ');
