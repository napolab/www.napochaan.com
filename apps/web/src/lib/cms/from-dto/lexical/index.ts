import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Restores a Lexical editor state from the `*JSON` string the CMS DTOs carry
// (the cms serialises it to keep Hono's response-type inference shallow).
// Absent → undefined. Pure.
export const parseLexicalJSON = (json: string | undefined): SerializedEditorState | undefined => {
  if (json === undefined) return undefined;

  // The cms produced this string from a stored editor state, so the shape is trusted.
  return JSON.parse(json) as SerializedEditorState;
};
