import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createPreviewURLFactory, draftPreviewRoute } from './index';

import type { PreviewURLArgs, PreviewURLResolver } from './index';

// The resolvers only read `data` and `collectionConfig`, so the rest of the
// Payload args are stubbed. Cast once here to keep each test readable.
const buildArgs = (overrides: { data?: Record<string, unknown>; slug?: string }): PreviewURLArgs => {
  const collectionConfig = overrides.slug === undefined ? undefined : { slug: overrides.slug };

  return { data: overrides.data ?? {}, collectionConfig, locale: {}, payload: {}, req: {} } as unknown as PreviewURLArgs;
};

describe('createPreviewURLFactory', () => {
  const originalBaseUrl = process.env.BASE_URL;

  beforeEach(() => {
    process.env.BASE_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env.BASE_URL = originalBaseUrl;
  });

  it('returns the URL from the first resolver that handles the document', () => {
    const first: PreviewURLResolver = () => 'https://example.com/a';
    const second: PreviewURLResolver = () => 'https://example.com/b';

    const url = createPreviewURLFactory([first, second]);

    expect(url(buildArgs({}))).toBe('https://example.com/a');
  });

  it('falls through to the next resolver when the previous returns undefined', () => {
    const first: PreviewURLResolver = () => undefined;
    const second: PreviewURLResolver = () => 'https://example.com/b';

    const url = createPreviewURLFactory([first, second]);

    expect(url(buildArgs({}))).toBe('https://example.com/b');
  });

  it('falls back to BASE_URL when no resolver matches', () => {
    const url = createPreviewURLFactory([() => undefined]);

    expect(url(buildArgs({}))).toBe('https://example.com');
  });
});

describe('draftPreviewRoute', () => {
  const route = draftPreviewRoute({
    slug: 'news',
    previewSecret: 's3cret',
    buildPath: (data) => `/news/preview/${data.id}`,
  });

  beforeEach(() => {
    process.env.BASE_URL = 'https://example.com';
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
});
