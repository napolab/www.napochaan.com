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

// Narrow each built node (and its inline children) enough to assert on their
// discriminating fields — same boundary-cast approach as above.
type ChildLike = { type?: string; text?: string; fields?: { linkType: string; url: string; newTab: boolean }; children?: { text?: string }[] };
type NodeLike = { type: string; tag?: string; children: ChildLike[] };
const nodesOf = (state: SerializedEditorState): NodeLike[] => state.root.children as unknown as NodeLike[];

// Narrow an upload node enough to assert on its relationTo and sentinel value.
type UploadLike = { type: string; relationTo?: string; format?: string; version?: number; fields?: { caption?: string } | null; value?: { __file?: string; __alt?: string } };
const uploadsOf = (state: SerializedEditorState): UploadLike[] => state.root.children as unknown as UploadLike[];

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

  it('turns a link segment in a p block into a custom link node carrying its fields and label', () => {
    const state = richTextFromBlocks([{ type: 'p', text: [{ text: 'StudioGnu', href: 'https://studiognu.org', newTab: true }] }]);

    const [node] = nodesOf(state);
    expect(node?.type).toBe('paragraph');

    const [child] = node?.children ?? [];
    expect(child?.type).toBe('link');
    expect(child?.fields?.linkType).toBe('custom');
    expect(child?.fields?.url).toBe('https://studiognu.org');
    expect(child?.fields?.newTab).toBe(true);
    expect(child?.children?.[0]?.text).toBe('StudioGnu');
  });

  it('defaults newTab to false when omitted on a p-block link segment', () => {
    const state = richTextFromBlocks([{ type: 'p', text: [{ text: 'home', href: '/' }] }]);

    const [node] = nodesOf(state);
    const [child] = node?.children ?? [];
    expect(child?.fields?.newTab).toBe(false);
  });

  it('turns a br segment in a p block into a linebreak node between the surrounding text', () => {
    const state = richTextFromBlocks([{ type: 'p', text: ['line one', { br: true }, 'line two'] }]);

    const [node] = nodesOf(state);
    const children = node?.children ?? [];

    expect(children.map((child) => child.type)).toEqual(['text', 'linebreak', 'text']);
    expect(children[0]?.text).toBe('line one');
    expect(children[2]?.text).toBe('line two');
  });

  it('preserves child order and types for a mixed string/link/string p block', () => {
    const state = richTextFromBlocks([{ type: 'p', text: ['before ', { text: 'link', href: 'https://example.com', newTab: true }, ' after'] }]);

    const [node] = nodesOf(state);
    const children = node?.children ?? [];

    expect(children.map((child) => child.type)).toEqual(['text', 'link', 'text']);
    expect(children[0]?.text).toBe('before ');
    expect(children[1]?.children?.[0]?.text).toBe('link');
    expect(children[2]?.text).toBe(' after');
  });

  it('turns an img block into an upload sentinel node carrying file and alt', () => {
    const state = richTextFromBlocks([{ type: 'img', file: 'v3-hero.png', alt: 'トップの巨大タイポ' }]);

    const [node] = uploadsOf(state);
    expect(node?.type).toBe('upload');
    expect(node?.relationTo).toBe('media');
    expect(node?.format).toBe('');
    expect(node?.version).toBe(3);
    expect(node?.fields).toBeNull();
    expect(node?.value).toEqual({ __file: 'v3-hero.png', __alt: 'トップの巨大タイポ' });
  });

  it('leaves an img block without a caption with null fields', () => {
    const state = richTextFromBlocks([{ type: 'img', file: 'v3-hero.png', alt: 'トップの巨大タイポ' }]);

    const [node] = uploadsOf(state);
    expect(node?.fields).toBeNull();
  });

  it('carries an img block caption in fields without touching the sentinel value', () => {
    const state = richTextFromBlocks([{ type: 'img', file: 'v3-hero.png', alt: 'トップの巨大タイポ', caption: 'milfy v3.0.0' }]);

    const [node] = uploadsOf(state);
    expect(node?.fields).toEqual({ caption: 'milfy v3.0.0' });
    expect(node?.value).toEqual({ __file: 'v3-hero.png', __alt: 'トップの巨大タイポ' });
  });
});
