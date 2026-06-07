import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type NewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  body?: SerializedEditorState;
};
