import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type NewsItem = {
  id: string;
  slug: string;
  date: string;
  category: string;
  title: string;
  // Explicit external destination. When set, links (e.g. the log timeline) point
  // here instead of the internal `/news/{id}` detail page.
  url?: string;
  body?: SerializedEditorState;
  // Admin-entered SEO overrides (Payload SEO plugin `meta` group), coerced from
  // the wire format: NULLs → undefined and the populated media → its url string.
  // Consumed by the detail page's generateMetadata.
  seo?: { title?: string; description?: string; image?: string };
};
