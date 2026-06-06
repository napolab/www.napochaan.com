import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type WorkRow = {
  id: string;
  no: string;
  title: string;
  type: string;
  year: number;
  thumbnail?: { src: string; width: number; height: number };
  description?: string;
  body?: SerializedEditorState;
};
