import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// One blog post. `date` is an ISO `YYYY-MM-DD` string; `index` is the display
// ordinal like '01'. `body` is the rich-text article (optional so a teaser-only
// entry stays valid). This is the feed domain type — replaced by a Payload
// `blog` collection later; the home teaser shows the latest few of this feed.
export type Post = {
  id: string;
  index: string;
  title: string;
  readMin: number;
  date: string;
  excerpt: string;
  body?: SerializedEditorState;
  // Admin-entered SEO overrides (Payload SEO plugin `meta` group), coerced from
  // the wire format: NULLs → undefined and the populated media → its url string.
  // Consumed by the detail page's generateMetadata.
  seo?: { title?: string; description?: string; image?: string };
};
