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
//   - the root file-convention card (`/og-default.png`, with type / width / height)
//     is emitted only while the page inherits the root `openGraph` / `twitter`; a page
//     passing its own object without images emits none (live Next home: no og:image).
//     A page's own og images also feed twitter:image when its twitter card has none.
//   - relative URLs resolve against the request origin (`metadataBase`); the bare
//     root resolves to the origin without a trailing slash, like Next's
//     resolveAbsoluteUrl (`https://napochaan.com`, not `…com/`).

const SITE_NAME = 'napochaan';
const SITE_DESCRIPTION = 'napochaan の個人サイト。';
const TITLE_SUFFIX = ` — ${SITE_NAME}`;
// Same bytes as the Next (site) opengraph-image.png / twitter-image.png (1280x630 png).
const DEFAULT_CARD_IMAGE: ResolvedImage = { url: '/og-default.png', type: 'image/png', width: 1280, height: 630 };

export const THEME_COLOR = 'oklch(0.490 0.287 266)';
export const VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';

export type MetadataInput = Partial<Metadata> & {
  // Next added `robots: noindex` to not-found responses on its own; 404/500 opt in.
  noindex?: boolean;
};

type ResolvedImage = { url: string; type?: string; width?: number; height?: number };

type Icon = { rel: 'icon' | 'apple-touch-icon'; href: string; type: string; sizes: string };

type Alternate = { type: string; href: string; title: string };

export type ResolvedMetadata = {
  title: string;
  description: string;
  // Absent when the page set `alternates` without a canonical (see resolveCanonical).
  canonical: string | undefined;
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
    images: ResolvedImage[];
  };
};

const ICONS: Icon[] = [
  { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '512x512' },
  { rel: 'apple-touch-icon', href: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
];

const absolute = (url: string, origin: string): string => {
  const resolved = new URL(url, origin);
  if (resolved.pathname === '/' && resolved.search === '' && resolved.hash === '') return resolved.origin;

  return resolved.href;
};

const resolveImages = (images: readonly ResolvedImage[], origin: string): ResolvedImage[] => images.map((image) => ({ ...image, url: absolute(image.url, origin) }));

const resolveTitle = (title: MetadataInput['title']): string => {
  if (title === undefined) return SITE_NAME;
  if (typeof title === 'string') return `${title}${TITLE_SUFFIX}`;

  return title.absolute;
};

// Next merged a page's `alternates` over the root's (`canonical: '/'`) as one object:
// a page that sets `alternates` without `canonical` (live /gallery: feed only) emits none.
const resolveCanonical = (input: MetadataInput, origin: string): string | undefined => {
  if (input.alternates === undefined) return absolute('/', origin);
  if (input.alternates.canonical === undefined) return undefined;

  return absolute(input.alternates.canonical, origin);
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
  if (og === undefined) {
    return {
      type: 'website',
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: absolute('/', origin),
      locale: 'ja_JP',
      images: resolveImages([DEFAULT_CARD_IMAGE], origin),
    };
  }

  return {
    type: og.type,
    siteName: og.siteName,
    title: og.title,
    description: og.description,
    url: absolute(og.url, origin),
    locale: og.locale,
    images: resolveImages(og.images ?? [], origin),
  };
};

const resolveTwitter = (input: MetadataInput, origin: string, pageOgImages: ResolvedImage[]): ResolvedMetadata['twitter'] => {
  const twitter = input.twitter;
  if (twitter === undefined) {
    return { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION, images: resolveImages([DEFAULT_CARD_IMAGE], origin) };
  }
  const images =
    twitter.images === undefined
      ? pageOgImages
      : resolveImages(
          twitter.images.map((url) => ({ url })),
          origin,
        );

  return { card: twitter.card, title: twitter.title, description: twitter.description, images };
};

export const buildMetadata = (input: MetadataInput, origin: string): ResolvedMetadata => {
  const openGraph = resolveOpenGraph(input, origin);

  return {
    title: resolveTitle(input.title),
    description: input.description ?? SITE_DESCRIPTION,
    canonical: resolveCanonical(input, origin),
    robots: resolveRobots(input, origin),
    alternates: resolveAlternates(input, origin),
    icons: ICONS,
    openGraph,
    twitter: resolveTwitter(input, origin, input.openGraph === undefined ? [] : openGraph.images),
  };
};
