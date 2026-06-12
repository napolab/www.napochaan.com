import { describe, expect, it } from 'vitest';

import { applyBodySentinels, collectBodyMedia } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// The lexical serialized types are structurally awkward; build literal bodies
// untyped and cast once at the boundary, mirroring resolve-body-media's tests.
const bodyOf = (children: readonly unknown[]): SerializedEditorState =>
  ({
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  }) as unknown as SerializedEditorState;

// A depth-1 populated upload node: value is the full Media object as Payload
// returns it (the staging shape seed:export sees).
const populatedMedia = (id: number, filename: string, alt: unknown): Record<string, unknown> => ({
  id,
  alt,
  updatedAt: '2026-06-11T00:00:00.000Z',
  createdAt: '2026-06-11T00:00:00.000Z',
  url: `/api/media/file/${filename}`,
  thumbnailURL: null,
  filename,
  mimeType: 'image/png',
  filesize: 1024,
  width: 100,
  height: 100,
  focalX: 50,
  focalY: 50,
});

const populatedUpload = (id: number, filename: string, alt: unknown, fields: unknown = null): unknown => ({
  type: 'upload',
  relationTo: 'media',
  format: '',
  version: 3,
  fields,
  value: populatedMedia(id, filename, alt),
});

const sentinelUpload = (file: string, alt: string): unknown => ({
  type: 'upload',
  relationTo: 'media',
  format: '',
  version: 3,
  fields: null,
  value: { __file: file, __alt: alt },
});

// An image-row block node: media lives at node.fields.cells[i].image as a
// populated Media object (the staging shape seed:export sees), NOT in `value`
// nor in `children`.
const imageRowBlock = (cells: readonly unknown[]): unknown => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { id: 'b1', blockType: 'image-row', cells },
});

const cell = (id: number, filename: string, alt: unknown, caption?: string): unknown => ({ image: populatedMedia(id, filename, alt), caption });

const paragraph = (text: string): unknown => ({
  type: 'paragraph',
  textFormat: 0,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
});

// Narrow an upload node enough to assert on its rewritten value.
type UploadLike = { type: string; value?: unknown; fields?: unknown };
const childrenOf = (body: SerializedEditorState): UploadLike[] => body.root.children as unknown as UploadLike[];

describe('collectBodyMedia', () => {
  it('returns an empty list for a body with no upload nodes', () => {
    const body = bodyOf([paragraph('hello')]);

    expect(collectBodyMedia(body)).toEqual([]);
  });

  it('collects every populated media object in document order', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', 'alt a'), paragraph('between'), populatedUpload(56, 'b.png', 'alt b')]);

    const collected = collectBodyMedia(body);

    expect(collected.map((media) => media.filename)).toEqual(['a.png', 'b.png']);
    expect(collected.map((media) => media.id)).toEqual([55, 56]);
  });

  it('collects populated media nested inside container nodes', () => {
    const container = { type: 'block', children: [populatedUpload(57, 'nested.png', 'nested alt')] };
    const body = bodyOf([container]);

    expect(collectBodyMedia(body).map((media) => media.filename)).toEqual(['nested.png']);
  });

  it('ignores upload nodes whose value is a numeric id', () => {
    const numeric = { type: 'upload', relationTo: 'media', format: '', version: 3, fields: null, value: 7 };
    const body = bodyOf([numeric, populatedUpload(55, 'a.png', 'alt a')]);

    expect(collectBodyMedia(body).map((media) => media.filename)).toEqual(['a.png']);
  });

  it('ignores upload nodes whose value is already a sentinel', () => {
    const body = bodyOf([sentinelUpload('done.png', 'done alt'), populatedUpload(55, 'a.png', 'alt a')]);

    expect(collectBodyMedia(body).map((media) => media.filename)).toEqual(['a.png']);
  });

  it('collects populated media nested inside a block node fields (image-row cells)', () => {
    const body = bodyOf([imageRowBlock([cell(60, 'left.png', 'left alt'), cell(61, 'right.png', 'right alt')])]);

    const collected = collectBodyMedia(body);

    expect(collected.map((media) => media.filename)).toEqual(['left.png', 'right.png']);
    expect(collected.map((media) => media.id)).toEqual([60, 61]);
  });

  it('collects block-embedded media in document order alongside upload nodes', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', 'alt a'), imageRowBlock([cell(60, 'left.png', 'left alt'), cell(61, 'right.png', 'right alt')]), populatedUpload(56, 'b.png', 'alt b')]);

    expect(collectBodyMedia(body).map((media) => media.filename)).toEqual(['a.png', 'left.png', 'right.png', 'b.png']);
  });

  it('ignores upload nodes whose value object has no string filename', () => {
    const broken = { type: 'upload', relationTo: 'media', format: '', version: 3, fields: null, value: { id: 9, alt: 'no filename' } };
    const body = bodyOf([broken]);

    expect(collectBodyMedia(body)).toEqual([]);
  });

  it('does not mutate the input body', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', 'alt a')]);
    const snapshot = structuredClone(body);

    collectBodyMedia(body);

    expect(body).toEqual(snapshot);
  });
});

describe('applyBodySentinels', () => {
  it('rewrites a populated value to a { __file, __alt } sentinel', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', 'alt a')]);

    const next = applyBodySentinels(body);

    const [node] = childrenOf(next);
    expect(node?.type).toBe('upload');
    expect(node?.value).toEqual({ __file: 'a.png', __alt: 'alt a' });
  });

  it('preserves the sibling fields (e.g. caption) and surrounding nodes when sentinelizing', () => {
    const body = bodyOf([paragraph('before'), populatedUpload(55, 'a.png', 'alt a', { caption: 'milfy v3.0.0' }), paragraph('after')]);

    const next = applyBodySentinels(body);

    expect(next.root.children).toHaveLength(3);
    const node = childrenOf(next)[1];
    expect(node?.value).toEqual({ __file: 'a.png', __alt: 'alt a' });
    expect(node?.fields).toEqual({ caption: 'milfy v3.0.0' });
    expect(childrenOf(next)[0]?.type).toBe('paragraph');
    expect(childrenOf(next)[2]?.type).toBe('paragraph');
  });

  it('sentinelizes a populated upload nested inside a container node', () => {
    const container = { type: 'block', children: [populatedUpload(57, 'nested.png', 'nested alt')] };
    const body = bodyOf([container]);

    const next = applyBodySentinels(body);

    const [outer] = next.root.children as unknown as { children?: UploadLike[] }[];
    expect(outer?.children?.[0]?.value).toEqual({ __file: 'nested.png', __alt: 'nested alt' });
  });

  it('sentinelizes populated media embedded in a block node fields (image-row cells), preserving captions', () => {
    const body = bodyOf([imageRowBlock([cell(60, 'left.png', 'left alt', 'left tag'), cell(61, 'right.png', 'right alt', 'right tag')])]);

    const next = applyBodySentinels(body);

    const [block] = next.root.children as unknown as { fields?: { cells?: { image?: unknown; caption?: unknown }[] } }[];
    expect(block?.fields?.cells?.[0]?.image).toEqual({ __file: 'left.png', __alt: 'left alt' });
    expect(block?.fields?.cells?.[0]?.caption).toBe('left tag');
    expect(block?.fields?.cells?.[1]?.image).toEqual({ __file: 'right.png', __alt: 'right alt' });
    expect(block?.fields?.cells?.[1]?.caption).toBe('right tag');
  });

  it('maps a missing or null alt to an empty __alt', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', null), populatedUpload(56, 'b.png', undefined)]);

    const next = applyBodySentinels(body);

    expect(childrenOf(next)[0]?.value).toEqual({ __file: 'a.png', __alt: '' });
    expect(childrenOf(next)[1]?.value).toEqual({ __file: 'b.png', __alt: '' });
  });

  it('leaves numeric values, sentinel values, and unresolvable objects untouched', () => {
    const numeric = { type: 'upload', relationTo: 'media', format: '', version: 3, fields: null, value: 7 };
    const broken = { type: 'upload', relationTo: 'media', format: '', version: 3, fields: null, value: { id: 9, alt: 'no filename' } };
    const body = bodyOf([numeric, sentinelUpload('done.png', 'done alt'), broken]);

    const next = applyBodySentinels(body);

    expect(childrenOf(next)[0]?.value).toBe(7);
    expect(childrenOf(next)[1]?.value).toEqual({ __file: 'done.png', __alt: 'done alt' });
    expect(childrenOf(next)[2]?.value).toEqual({ id: 9, alt: 'no filename' });
  });

  it('is idempotent: applying twice equals applying once', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', 'alt a'), paragraph('text')]);

    const once = applyBodySentinels(body);
    const twice = applyBodySentinels(once);

    expect(twice).toEqual(once);
  });

  it('does not mutate the input body', () => {
    const body = bodyOf([populatedUpload(55, 'a.png', 'alt a')]);
    const snapshot = structuredClone(body);

    applyBodySentinels(body);

    expect(body).toEqual(snapshot);
  });
});
