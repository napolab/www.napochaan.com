import { describe, expect, it } from 'vitest';

import { applyResolvedMedia, collectUploadSentinels } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// The lexical serialized types are structurally awkward; build literal bodies
// untyped and cast once at the boundary, mirroring sample-rich-text's approach.
const bodyOf = (children: readonly unknown[]): SerializedEditorState =>
  ({
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  }) as unknown as SerializedEditorState;

const sentinel = (file: string, alt: string): unknown => ({
  type: 'upload',
  relationTo: 'media',
  format: '',
  version: 3,
  fields: null,
  value: { __file: file, __alt: alt },
});

const paragraph = (text: string): unknown => ({
  type: 'paragraph',
  textFormat: 0,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
});

// An image-row block node: media lives at node.fields.cells[i].image as a
// `{ __file, __alt }` sentinel, NOT in `value` nor in `children`.
const imageRowBlock = (cells: readonly unknown[]): unknown => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { id: 'b1', blockType: 'image-row', cells },
});

const cell = (file: string, alt: string, caption?: string): unknown => ({ image: { __file: file, __alt: alt }, caption });

const sentinelWithFields = (file: string, alt: string, fields: unknown): unknown => ({
  type: 'upload',
  relationTo: 'media',
  format: '',
  version: 3,
  fields,
  value: { __file: file, __alt: alt },
});

// Narrow a resolved upload node enough to assert on its rewritten value.
type UploadLike = { type: string; value?: unknown; fields?: unknown };
const childrenOf = (body: SerializedEditorState): UploadLike[] => body.root.children as unknown as UploadLike[];

describe('collectUploadSentinels', () => {
  it('returns an empty list for a body with no upload nodes', () => {
    const body = bodyOf([paragraph('hello')]);

    expect(collectUploadSentinels(body)).toEqual([]);
  });

  it('collects file and alt from every upload sentinel in document order', () => {
    const body = bodyOf([sentinel('a.png', 'alt a'), paragraph('between'), sentinel('b.png', 'alt b')]);

    expect(collectUploadSentinels(body)).toEqual([
      { file: 'a.png', alt: 'alt a' },
      { file: 'b.png', alt: 'alt b' },
    ]);
  });

  it('ignores upload nodes whose value is already a resolved numeric id', () => {
    const resolved = { type: 'upload', relationTo: 'media', format: '', version: 3, fields: null, value: 7 };
    const body = bodyOf([resolved, sentinel('a.png', 'alt a')]);

    expect(collectUploadSentinels(body)).toEqual([{ file: 'a.png', alt: 'alt a' }]);
  });

  it('collects sentinels nested inside container nodes', () => {
    const container = { type: 'block', children: [sentinel('nested.png', 'nested alt')] };
    const body = bodyOf([container]);

    expect(collectUploadSentinels(body)).toEqual([{ file: 'nested.png', alt: 'nested alt' }]);
  });

  it('collects sentinels embedded in a block node fields (image-row cells)', () => {
    const body = bodyOf([imageRowBlock([cell('left.png', 'left alt'), cell('right.png', 'right alt')])]);

    expect(collectUploadSentinels(body)).toEqual([
      { file: 'left.png', alt: 'left alt' },
      { file: 'right.png', alt: 'right alt' },
    ]);
  });

  it('collects block-embedded sentinels in document order alongside upload nodes', () => {
    const body = bodyOf([sentinel('a.png', 'alt a'), imageRowBlock([cell('left.png', 'left alt'), cell('right.png', 'right alt')]), sentinel('b.png', 'alt b')]);

    expect(collectUploadSentinels(body).map((s) => s.file)).toEqual(['a.png', 'left.png', 'right.png', 'b.png']);
  });

  it('does not mutate the input body', () => {
    const body = bodyOf([sentinel('a.png', 'alt a')]);
    const snapshot = structuredClone(body);

    collectUploadSentinels(body);

    expect(body).toEqual(snapshot);
  });
});

describe('applyResolvedMedia', () => {
  it('rewrites a sentinel value to the resolved numeric id', () => {
    const body = bodyOf([sentinel('a.png', 'alt a')]);

    const next = applyResolvedMedia(body, [{ file: 'a.png', alt: 'alt a', id: 42 }]);

    const [node] = childrenOf(next);
    expect(node?.type).toBe('upload');
    expect(node?.value).toBe(42);
  });

  it('preserves the sibling fields (e.g. caption) when rewriting a sentinel value', () => {
    const body = bodyOf([sentinelWithFields('a.png', 'alt a', { caption: 'milfy v3.0.0' })]);

    const next = applyResolvedMedia(body, [{ file: 'a.png', alt: 'alt a', id: 42 }]);

    const [node] = childrenOf(next);
    expect(node?.value).toBe(42);
    expect(node?.fields).toEqual({ caption: 'milfy v3.0.0' });
  });

  it('drops upload nodes whose resolution id is undefined', () => {
    const body = bodyOf([paragraph('keep'), sentinel('missing.png', 'gone')]);

    const next = applyResolvedMedia(body, [{ file: 'missing.png', alt: 'gone', id: undefined }]);

    expect(next.root.children).toHaveLength(1);
    expect(childrenOf(next)[0]?.type).toBe('paragraph');
  });

  it('rewrites resolved sentinels and drops unresolved ones in the same body', () => {
    const body = bodyOf([sentinel('a.png', 'alt a'), sentinel('b.png', 'alt b')]);

    const next = applyResolvedMedia(body, [
      { file: 'a.png', alt: 'alt a', id: 1 },
      { file: 'b.png', alt: 'alt b', id: undefined },
    ]);

    expect(next.root.children).toHaveLength(1);
    expect(childrenOf(next)[0]?.value).toBe(1);
  });

  it('rewrites a sentinel nested inside a container node', () => {
    const container = { type: 'block', children: [sentinel('nested.png', 'nested alt')] };
    const body = bodyOf([container]);

    const next = applyResolvedMedia(body, [{ file: 'nested.png', alt: 'nested alt', id: 9 }]);

    const [outer] = next.root.children as unknown as { children?: UploadLike[] }[];
    expect(outer?.children?.[0]?.value).toBe(9);
  });

  it('drops an unresolved sentinel nested inside a container node', () => {
    const container = { type: 'block', children: [sentinel('nested.png', 'nested alt'), paragraph('keep')] };
    const body = bodyOf([container]);

    const next = applyResolvedMedia(body, [{ file: 'nested.png', alt: 'nested alt', id: undefined }]);

    const [outer] = next.root.children as unknown as { children?: UploadLike[] }[];
    expect(outer?.children).toHaveLength(1);
    expect(outer?.children?.[0]?.type).toBe('paragraph');
  });

  it('rewrites sentinels embedded in a block node fields (image-row cells) to numeric ids, preserving captions', () => {
    const body = bodyOf([imageRowBlock([cell('left.png', 'left alt', 'left tag'), cell('right.png', 'right alt', 'right tag')])]);

    const next = applyResolvedMedia(body, [
      { file: 'left.png', alt: 'left alt', id: 10 },
      { file: 'right.png', alt: 'right alt', id: 11 },
    ]);

    const [block] = next.root.children as unknown as { fields?: { cells?: { image?: unknown; caption?: unknown }[] } }[];
    expect(block?.fields?.cells?.[0]?.image).toBe(10);
    expect(block?.fields?.cells?.[0]?.caption).toBe('left tag');
    expect(block?.fields?.cells?.[1]?.image).toBe(11);
    expect(block?.fields?.cells?.[1]?.caption).toBe('right tag');
  });

  it('leaves an unresolved block-embedded sentinel as-is when its id is undefined (import must not break)', () => {
    const body = bodyOf([imageRowBlock([cell('left.png', 'left alt'), cell('missing.png', 'gone')])]);

    const next = applyResolvedMedia(body, [
      { file: 'left.png', alt: 'left alt', id: 10 },
      { file: 'missing.png', alt: 'gone', id: undefined },
    ]);

    const [block] = next.root.children as unknown as { fields?: { cells?: { image?: unknown }[] } }[];
    expect(block?.fields?.cells?.[0]?.image).toBe(10);
    // Unresolved cell keeps its sentinel rather than being dropped (a block cell
    // cannot be safely removed the way a top-level upload node can).
    expect(block?.fields?.cells?.[1]?.image).toEqual({ __file: 'missing.png', __alt: 'gone' });
  });

  it('leaves non-upload nodes untouched', () => {
    const body = bodyOf([paragraph('hello')]);

    const next = applyResolvedMedia(body, []);

    expect(childrenOf(next)[0]?.type).toBe('paragraph');
  });

  it('does not mutate the input body', () => {
    const body = bodyOf([sentinel('a.png', 'alt a')]);
    const snapshot = structuredClone(body);

    applyResolvedMedia(body, [{ file: 'a.png', alt: 'alt a', id: 42 }]);

    expect(body).toEqual(snapshot);
  });
});
