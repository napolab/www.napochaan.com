import { isProductionHost } from '@utils/is-production-host';

import type { Metadata } from '@utils/seo/metadata';

// Port of the Next `(site)` root layout `generateMetadata` + `viewport`, plus the
// file-convention metadata Next derived from files (`icon.png`, `apple-icon.png`,
// `opengraph-image.png`, `twitter-image.png` — the last two are the same bytes as
// `/og-default.png`). Pages pass what they used to return from `generateMetadata`
// (`resolveSectionMetadata` / `resolveDetailMetadata` output, or a bare `{ title }`),
// and this resolves it the way Next merged a page over the root layout:
//   - `title` gets the `%s — napochaan` template; `{ absolute }` bypasses it.
//   - `openGraph` / `twitter` / `alternates` from the page replace the root's whole
//     object (shallow merge per top-level key).
//   - with no page image, og:image falls back to the root file-convention card;
//     twitter:image falls back to og:image.
//   - relative URLs resolve against the request origin (`metadataBase`).

const SITE_NAME = 'napochaan';
const SITE_DESCRIPTION = 'napochaan の個人サイト。';
const TITLE_SUFFIX = ` — ${SITE_NAME}`;
const DEFAULT_OG_IMAGE: ResolvedImage = { url: '/og-default.png', width: 1280, height: 630, type: 'image/png' };

export const THEME_COLOR = 'oklch(0.490 0.287 266)';
export const VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';

export type MetadataInput = Partial<Metadata> & {
  // Next added `robots: noindex` to not-found responses on its own; 404/500 opt in.
  noindex?: boolean;
};

type ResolvedImage = { url: string; width?: number; height?: number; type?: string };

type Icon = { rel: 'icon' | 'apple-touch-icon'; href: string; type: string; sizes: string };

type Alternate = { type: string; href: string; title: string };

export type ResolvedMetadata = {
  title: string;
  description: string;
  canonical: string;
  robots: 'noindex, nofollow' | 'noindex' | undefined;
  alternates: Alternate[];
  icons: Icon[];
  openGraph: {
    type: 'website' | 'article';
    siteName: string;
    title: string;
    description?: string;
    url: string;
    locale: string;
    images: ResolvedImage[];
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description?: string;
    images: string[];
  };
};

const ICONS: Icon[] = [
  { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '512x512' },
  { rel: 'apple-touch-icon', href: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
];

const absolute = (url: string, origin: string): string => new URL(url, origin).href;

const resolveTitle = (title: MetadataInput['title']): string => {
  if (title === undefined) return SITE_NAME;
  if (typeof title === 'string') return `${title}${TITLE_SUFFIX}`;

  return title.absolute;
};

const resolveRobots = (input: MetadataInput, origin: string): ResolvedMetadata['robots'] => {
  if (!isProductionHost(origin)) return 'noindex, nofollow';
  if (input.noindex === true) return 'noindex';

  return undefined;
};

const resolveAlternates = (input: MetadataInput, origin: string): Alternate[] =>
  Object.entries(input.alternates?.types ?? {}).flatMap(([type, links]) => links.map((link) => ({ type, href: absolute(link.url, origin), title: link.title })));

const resolveOpenGraph = (input: MetadataInput, origin: string): ResolvedMetadata['openGraph'] => {
  const og = input.openGraph;
  const images = og?.images ?? [DEFAULT_OG_IMAGE];
  const resolvedImages = images.map((image) => ({ ...image, url: absolute(image.url, origin) }));
  if (og === undefined) {
    return { type: 'website', siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION, url: absolute('/', origin), locale: 'ja_JP', images: resolvedImages };
  }

  return { type: og.type, siteName: og.siteName, title: og.title, description: og.description, url: absolute(og.url, origin), locale: og.locale, images: resolvedImages };
};

const resolveTwitter = (input: MetadataInput, origin: string, ogImages: ResolvedImage[]): ResolvedMetadata['twitter'] => {
  const twitter = input.twitter ?? { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION };
  const images = twitter.images?.map((url) => absolute(url, origin)) ?? ogImages.map((image) => image.url);

  return { card: twitter.card, title: twitter.title, description: twitter.description, images };
};

export const buildMetadata = (input: MetadataInput, origin: string): ResolvedMetadata => {
  const openGraph = resolveOpenGraph(input, origin);

  return {
    title: resolveTitle(input.title),
    description: input.description ?? SITE_DESCRIPTION,
    canonical: absolute(input.alternates?.canonical ?? '/', origin),
    robots: resolveRobots(input, origin),
    alternates: resolveAlternates(input, origin),
    icons: ICONS,
    openGraph,
    twitter: resolveTwitter(input, origin, openGraph.images),
  };
};
