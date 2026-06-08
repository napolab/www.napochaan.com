import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type WorkRow = {
  id: string;
  no: string;
  title: string;
  type: string;
  year: number;
  // ISO YYYY-MM-DD in Asia/Tokyo. Optional — absent when the source only has year
  // precision (e.g. sample data). Used by the log timeline for month/day display
  // and by the works RSS feed for a precise pubDate.
  date?: string;
  // Explicit external destination. When set, links (e.g. the log timeline) point
  // here instead of the internal `/works/{id}` detail page.
  url?: string;
  thumbnail?: { src: string; width: number; height: number };
  description?: string;
  body?: SerializedEditorState;
};
