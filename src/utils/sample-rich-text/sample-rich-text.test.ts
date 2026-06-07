import { describe, expect, it } from 'vitest';

import { richTextFromBlocks, richTextFromParagraphs } from './index';

import { extractHeadings } from '@components/rich-text/toc';

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

// Narrow each built node enough to assert on its discriminating fields.
type NodeLike = { type: string; tag?: string; children: { text?: string }[] };
const nodesOf = (state: SerializedEditorState): NodeLike[] => state.root.children as unknown as NodeLike[];

describe('richTextFromBlocks', () => {
  it('turns an h2 block into a heading node tagged h2', () => {
    const state = richTextFromBlocks([{ type: 'h2', text: 'Section' }]);

    const [node] = nodesOf(state);
    expect(node?.type).toBe('heading');
    expect(node?.tag).toBe('h2');
    expect(node?.children[0]?.text).toBe('Section');
  });

  it('turns an h3 block into a heading node tagged h3', () => {
    const state = richTextFromBlocks([{ type: 'h3', text: 'Sub' }]);

    const [node] = nodesOf(state);
    expect(node?.type).toBe('heading');
    expect(node?.tag).toBe('h3');
  });

  it('turns a p block into a paragraph node', () => {
    const state = richTextFromBlocks([{ type: 'p', text: 'Body text.' }]);

    const [node] = nodesOf(state);
    expect(node?.type).toBe('paragraph');
    expect(node?.children[0]?.text).toBe('Body text.');
  });

  it('exposes its h2/h3 blocks to extractHeadings in order', () => {
    const state = richTextFromBlocks([
      { type: 'h2', text: 'First' },
      { type: 'p', text: 'ignored' },
      { type: 'h3', text: 'Second' },
    ]);

    const headings = extractHeadings(state);
    expect(headings.map((h) => h.text)).toEqual(['First', 'Second']);
    expect(headings.map((h) => h.level)).toEqual([2, 3]);
  });
});
