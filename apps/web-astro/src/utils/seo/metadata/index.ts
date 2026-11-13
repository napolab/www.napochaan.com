// Page metadata shape produced by the resolve-*-metadata helpers and rendered
// into <head> by the page layout. Mirrors the subset of Next's `Metadata` the
// site uses, so the helpers port unchanged.

type AlternateLink = { url: string; title: string };

// `type` / `width` / `height` render as og:image:* (and twitter:image:* when the
// twitter card inherits the og images), as Next emitted them for file-convention images.
type OpenGraphImage = { url: string; type?: string; width?: number; height?: number };

export type Metadata = {
  // A bare title gets the site suffix appended; `absolute` is used verbatim.
  title: string | { absolute: string };
  description?: string;
  alternates?: {
    canonical: string;
    types?: Record<string, AlternateLink[]>;
  };
  openGraph?: {
    type: 'website' | 'article';
    siteName: string;
    locale: string;
    url: string;
    title: string;
    description?: string;
    images?: OpenGraphImage[];
  };
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description?: string;
    images?: string[];
  };
};
