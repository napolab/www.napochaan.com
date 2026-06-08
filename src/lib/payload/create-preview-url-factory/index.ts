import type { LivePreviewConfig } from 'payload';

// Narrow Payload's `url` field (string | function) down to the function form,
// then borrow its argument type so resolvers stay in lock-step with Payload.
type LivePreviewURLFn = Extract<NonNullable<LivePreviewConfig['url']>, (args: never) => unknown>;

export type PreviewURLArgs = Parameters<LivePreviewURLFn>[0];

// A resolver inspects the Live Preview args and returns a preview URL when it
// handles that document, or `undefined` to defer to the next resolver.
export type PreviewURLResolver = (args: PreviewURLArgs) => string | undefined;

const resolveBaseUrl = (): string => process.env.BASE_URL ?? 'http://localhost:3000';

// Compose collection-specific resolvers into one Live Preview `url` function.
// Resolvers run in order; the first to return a URL wins. When none match (a
// collection without a preview route), the editor falls back to the base URL.
// Adding a previewable collection = appending one resolver, no growing if/else.
export const createPreviewURLFactory =
  (resolvers: readonly PreviewURLResolver[]): LivePreviewURLFn =>
  (args) => {
    for (const resolve of resolvers) {
      const url = resolve(args);
      if (url !== undefined) return url;
    }

    return resolveBaseUrl();
  };

type DraftPreviewRoute = {
  slug: string;
  previewSecret: string;
  buildPath: (data: PreviewURLArgs['data']) => string;
};

// Build a resolver that, for documents of `slug`, routes the iframe through the
// secret-gated `/next/preview` handshake (which enables draft mode and redirects
// to the draft-only preview page). Returns undefined for any other collection.
export const draftPreviewRoute =
  ({ slug, previewSecret, buildPath }: DraftPreviewRoute): PreviewURLResolver =>
  ({ data, collectionConfig }) => {
    if (collectionConfig?.slug !== slug) return undefined;

    const url = new URL('/next/preview', resolveBaseUrl());
    url.search = new URLSearchParams({ path: buildPath(data), previewSecret }).toString();

    return url.toString();
  };
