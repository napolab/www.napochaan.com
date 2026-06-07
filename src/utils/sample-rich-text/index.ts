import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Builds a valid Payload-Lexical editor state from plain strings — one paragraph
// node per input, each holding a single text node. The lexical serialized types
// are structurally awkward, so the literal is assembled untyped and cast once at
// the boundary (mirrors src/components/rich-text/rich-text.test.tsx).
const textNode = (value: string): unknown => ({
  type: 'text',
  text: value,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const paragraphNode = (value: string): unknown => ({
  type: 'paragraph',
  textFormat: 0,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [textNode(value)],
});

const headingNode = (tag: 'h2' | 'h3', value: string): unknown => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [textNode(value)],
});

export type SampleBlock = { type: 'h2' | 'h3' | 'p'; text: string };

const blockNode = (block: SampleBlock): unknown => {
  switch (block.type) {
    case 'h2':
      return headingNode('h2', block.text);
    case 'h3':
      return headingNode('h3', block.text);
    case 'p':
      return paragraphNode(block.text);
  }
};

// Builds a valid Payload-Lexical editor state from typed blocks — h2/h3 become
// heading nodes (so the TOC has anchors) and p becomes a paragraph. Single
// boundary cast, mirroring richTextFromParagraphs.
export const richTextFromBlocks = (blocks: readonly SampleBlock[]): SerializedEditorState => {
  const raw: unknown = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: blocks.map(blockNode),
    },
  };

  return raw as SerializedEditorState;
};

export const richTextFromParagraphs = (paragraphs: readonly string[]): SerializedEditorState => {
  const raw: unknown = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map(paragraphNode),
    },
  };

  return raw as SerializedEditorState;
};
