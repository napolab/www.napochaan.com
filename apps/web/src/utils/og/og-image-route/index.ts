import { CONTENT_TYPE, SIZE } from '../og-card';

// Next served each detail section's `[slug]/opengraph-image.tsx` at
// `/<section>/<slug>/opengraph-image-<suffix>`: the suffix is Next's
// `getMetadataRouteSuffix`, djb2(`/(site)/<section>/[slug]`) in base 36 (6 chars),
// added because the route sat under the `(site)` group. The bare `/opengraph-image`
// path 404s on the Next site, so the Astro routes keep the suffixed path and shared
// card URLs keep resolving. Next also appended `?<contenthash>` of the route source —
// a pure cache-buster, dropped here.
//
// Each suffix is also the literal route filename
// (`src/pages/<section>/[slug]/opengraph-image-<suffix>.ts`); og-image-route.test.ts
// asserts the files exist.
export const OG_IMAGE_ROUTE_SUFFIX = {
  blog: 'fx5gi7',
  news: '5nvrt4',
  works: 'apsyht',
} as const;

export type OgImageSection = keyof typeof OG_IMAGE_ROUTE_SUFFIX;

export const ogImagePath = (section: OgImageSection, slug: string): string => `/${section}/${slug}/opengraph-image-${OG_IMAGE_ROUTE_SUFFIX[section]}`;

// The og:image entry for a detail page (Next derived type / width / height from the
// route's `contentType` / `size` exports).
export const ogImageEntry = (section: OgImageSection, slug: string) => ({
  url: ogImagePath(section, slug),
  type: CONTENT_TYPE,
  width: SIZE.width,
  height: SIZE.height,
});
