import { describe, expect, it } from 'vitest';

import { createPreviewURLFactory, draftPreviewRoute } from './index';

import type { PreviewURLArgs, PreviewURLResolver } from './index';

// The resolvers only read `data` and `collectionConfig`, so the rest of the
// Payload args are stubbed. Cast once here to keep each test readable.
const buildArgs = (overrides: { data?: Record<string, unknown>; slug?: string }): PreviewURLArgs => {
  const collectionConfig = overrides.slug === undefined ? undefined : { slug: overrides.slug };

  return { data: overrides.data ?? {}, collectionConfig, locale: {}, payload: {}, req: {} } as unknown as PreviewURLArgs;
};

// The `WEB_ORIGIN` wrangler var of each environment. The cms admin opens the web
// app's preview handshake, so every preview URL is rooted at the web origin.
const WEB_ORIGIN = 'https://example.com';

describe('createPreviewURLFactory', () => {
  it('returns the URL from the first resolver that handles the document', () => {
    const first: PreviewURLResolver = () => 'https://example.com/a';
    const second: PreviewURLResolver = () => 'https://example.com/b';

    const url = createPreviewURLFactory({ webOrigin: WEB_ORIGIN, resolvers: [first, second] });

    expect(url(buildArgs({}))).toBe('https://example.com/a');
  });

  it('falls through to the next resolver when the previous returns undefined', () => {
    const first: PreviewURLResolver = () => undefined;
    const second: PreviewURLResolver = () => 'https://example.com/b';

    const url = createPreviewURLFactory({ webOrigin: WEB_ORIGIN, resolvers: [first, second] });

    expect(url(buildArgs({}))).toBe('https://example.com/b');
  });

  it('falls back to WEB_ORIGIN when no resolver matches', () => {
    const url = createPreviewURLFactory({ webOrigin: 'https://stg.napochaan.com', resolvers: [() => undefined] });

    expect(url(buildArgs({}))).toBe('https://stg.napochaan.com');
  });
});

describe('draftPreviewRoute', () => {
  const route = draftPreviewRoute({
    webOrigin: WEB_ORIGIN,
    slug: 'news',
    previewSecret: 's3cret',
    buildPath: (data) => `/news/preview/${data.id}`,
  });

  it('returns undefined for a different collection', () => {
    expect(route(buildArgs({ slug: 'pages', data: { id: '1' } }))).toBeUndefined();
  });

  it('returns undefined when there is no collection config', () => {
    expect(route(buildArgs({ data: { id: '1' } }))).toBeUndefined();
  });

  it('routes the matching collection through the secret-gated handshake', () => {
    const result = route(buildArgs({ slug: 'news', data: { id: '42' } }));

    expect(result).toBe('https://example.com/next/preview?path=%2Fnews%2Fpreview%2F42&previewSecret=s3cret');
  });

  it('roots the handshake at WEB_ORIGIN (stg web app), not at the cms host', () => {
    const blog = draftPreviewRoute({
      webOrigin: 'https://stg.napochaan.com',
      slug: 'blog',
      previewSecret: 's',
      buildPath: (data) => `/blog/preview/${data.id}`,
    });

    const result = blog(buildArgs({ slug: 'blog', data: { id: '1' } }));

    // `path` is URLSearchParams-encoded (`/` → `%2F`); /next/preview decodes it.
    expect(result).toBe('https://stg.napochaan.com/next/preview?path=%2Fblog%2Fpreview%2F1&previewSecret=s');
  });
});
