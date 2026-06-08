import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type WorkRow = {
  id: string;
  no: string;
  title: string;
  type: string;
  year: number;
  // Explicit external destination. When set, links (e.g. the log timeline) point
  // here instead of the internal `/works/{id}` detail page.
  url?: string;
  thumbnail?: { src: string; width: number; height: number };
  description?: string;
  body?: SerializedEditorState;
};
