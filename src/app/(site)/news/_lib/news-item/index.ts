import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type NewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  // Explicit external destination. When set, links (e.g. the log timeline) point
  // here instead of the internal `/news/{id}` detail page.
  url?: string;
  body?: SerializedEditorState;
};
