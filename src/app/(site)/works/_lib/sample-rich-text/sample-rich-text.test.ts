import { describe, expect, it } from 'vitest';

import { richTextFromParagraphs } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Narrow the structurally-awkward lexical node into the shape this test asserts
// against — a single cast at the boundary, mirroring the helper's own boundary cast.
type ParagraphLike = { children: { text: string }[] };
const paragraphsOf = (state: SerializedEditorState): ParagraphLike[] => state.root.children as unknown as ParagraphLike[];

describe('richTextFromParagraphs', () => {
  it('builds one paragraph node per input string', () => {
    const state = richTextFromParagraphs(['one', 'two', 'three']);

    expect(state.root.children).toHaveLength(3);
  });

  it('wraps each paragraph around a single text node carrying the input string', () => {
    const state = richTextFromParagraphs(['first', 'second']);

    const texts = paragraphsOf(state).map((paragraph) => {
      expect(paragraph.children).toHaveLength(1);

      const [child] = paragraph.children;

      return child?.text;
    });

    expect(texts).toEqual(['first', 'second']);
  });

  it('produces zero children for an empty array', () => {
    const state = richTextFromParagraphs([]);

    expect(state.root.children).toHaveLength(0);
  });
});
