import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Builds valid Payload-Lexical editor states from plain data. The lexical
// serialized types are structurally awkward, so each literal is assembled
// untyped and cast once at the boundary (mirrors src/components/rich-text/rich-text.test.tsx).
const textNode = (value: string): unknown => ({
  type: 'text',
  text: value,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

// A paragraph segment is either inline text (string) or an inline link (object).
export type RichSegment = string | { text: string; href: string; newTab?: boolean };

const linkNode = (text: string, href: string, newTab: boolean): unknown => ({
  type: 'link',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  fields: { linkType: 'custom', url: href, newTab },
  children: [textNode(text)],
});

const segmentNode = (segment: RichSegment): unknown => {
  if (typeof segment === 'string') return textNode(segment);
  return linkNode(segment.text, segment.href, segment.newTab ?? false);
};

const toSegments = (content: string | readonly RichSegment[]): readonly RichSegment[] => (typeof content === 'string' ? [content] : content);

// A paragraph's content is a plain string or an ordered list of inline segments,
// so authored text can carry inline links alongside plain text.
const paragraphNode = (content: string | readonly RichSegment[]): unknown => ({
  type: 'paragraph',
  textFormat: 0,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: toSegments(content).map(segmentNode),
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

export type SampleBlock = { type: 'h2'; text: string } | { type: 'h3'; text: string } | { type: 'p'; text: string | readonly RichSegment[] };

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
// heading nodes (so the TOC has anchors) and p becomes a paragraph. A p block's
// text may be plain or a list of inline segments (for inline links). Single
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
