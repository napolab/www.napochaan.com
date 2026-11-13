// URL list for scripts/parity-check.mjs. Pure: no I/O, so it runs under vitest
// (src/scripts/parity-urls.test.ts).
//
// Every probe carries the status the reference side (A, the Next app) is expected to
// answer. parity-check fails when A deviates, so a broken cms binding (both sides 404 or
// 500 the same way) cannot pass as "parity".

// OG image route suffixes: the Next file-convention hashes, kept literally in the Astro
// route filenames (src/pages/<section>/[slug]/opengraph-image-<suffix>.ts).
export const OG_IMAGE_SUFFIXES = { blog: 'fx5gi7', news: '5nvrt4', works: 'apsyht' };

export const SECTIONS = ['blog', 'news', 'works'];

// How many real slugs per collection to probe (plus any dotted slug, which exercises
// the `.md` route split).
const SLUGS_PER_SECTION = 2;

const page = (path, expect = 200) => ({ path, expect });

export const FIXED_PROBES = [
  // pages
  page('/'),
  page('/about'),
  page('/colophon'),
  page('/contact'),
  page('/gallery'),
  page('/log'),
  page('/blog'),
  page('/news'),
  page('/works'),
  page('/blog/page/2'),
  page('/news/page/2'),
  page('/works/page/2'),
  // pagination edge cases
  page('/blog/page/1', 308),
  page('/news/page/1', 308),
  page('/works/page/1', 308),
  page('/blog/page/abc', 404),
  page('/news/page/01', 404),
  page('/works/page/0', 404),
  // past the end: Next streams notFound() inside Suspense → 200 (ruled: Astro 404s)
  page('/blog/page/3'),
  page('/news/page/3'),
  page('/works/page/3'),
  // markdown twins
  page('/about.md'),
  page('/blog.md'),
  page('/news.md'),
  page('/works.md'),
  page('/log.md'),
  // feeds and machine-readable endpoints
  page('/blog/rss.xml'),
  page('/news/rss.xml'),
  page('/works/rss.xml'),
  page('/log/rss.xml'),
  page('/gallery/rss.xml'),
  page('/llms.txt'),
  page('/llms-full.txt'),
  page('/sitemap.xml'),
  page('/robots.txt'),
  page('/.well-known/security.txt'),
  // static OG / icons
  page('/og-default.png'),
  // Next's hashed file-convention URLs (already shared on social / cached by crawlers)
  page('/opengraph-image-12o0cb.png'),
  page('/twitter-image-12o0cb.png'),
  page('/icon-12o0cb.png'),
  page('/apple-icon-12o0cb.png'),
  // Astro's un-hashed icon URL (Ruling: icon URL change); Next has no such file
  page('/icon.png', 404),
  // redirects
  page('/logs', 308),
  page('/logs?from=parity', 308),
  // preview: no draft cookie → 404; handshake without/with a wrong secret
  page('/blog/preview/1', 404),
  page('/news/preview/n0', 404),
  page('/works/preview/w0', 404),
  page('/gallery/preview', 404),
  page('/log/preview', 404),
  page('/next/preview?path=/blog/preview/1&previewSecret=wrong', 403),
  // the secret is checked before the path, so a bad path with a bad secret is still 403
  page('/next/preview?path=//evil.example&previewSecret=wrong', 403),
  // media proxy
  page('/api/media/file/does-not-exist.jpg', 404),
  // 404 probes
  page('/does-not-exist', 404),
  page('/blog/does-not-exist', 404),
  page('/blog/does-not-exist.md', 404),
  page('/news/does-not-exist', 404),
  page('/works/does-not-exist.md', 404),
  page('/deep/nested/missing/path', 404),
];

/** Pick the slugs to probe for one section from sitemap paths (`/blog/<slug>`). */
export const pickSectionSlugs = (paths, section) => {
  const prefix = `/${section}/`;
  const slugs = paths.filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/')).map((path) => path.slice(prefix.length));
  const dotted = slugs.find((slug) => slug.includes('.'));
  const picked = slugs.filter((slug) => !slug.includes('.')).slice(0, SLUGS_PER_SECTION);
  return dotted === undefined ? picked : [dotted, ...picked];
};

/** Paths (origin stripped) of every sitemap location. */
export const sitemapPaths = (locations) => locations.map((location) => new URL(location).pathname);

const detailProbes = (section, slug) => [page(`/${section}/${slug}`), page(`/${section}/${slug}.md`), page(`/${section}/${slug}/opengraph-image-${OG_IMAGE_SUFFIXES[section]}`)];

/** Fixed probes followed by the detail / `.md` / OG probes of the discovered slugs. */
export const buildProbes = (slugsBySection) => {
  const details = SECTIONS.flatMap((section) => (slugsBySection[section] ?? []).flatMap((slug) => detailProbes(section, slug)));
  const internalRewrite = SECTIONS.flatMap((section) => {
    const [slug] = slugsBySection[section] ?? [];
    if (slug === undefined) return [];
    // Next's internal rewrite target for `/<section>/<slug>.md`; ruled not public (404 on Astro).
    return [page(`/${section}/${slug}/md`)];
  });
  return [...FIXED_PROBES, ...details, ...internalRewrite];
};
