import { describe, expect, it } from 'vitest';

import { firstImageSrc } from '.';

import { richTextFromParagraphs } from '@utils/sample-rich-text';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Builds an editor state whose root carries the given child nodes verbatim,
// so a test can place upload nodes in any shape the renderer consumes.
const stateWithChildren = (children: readonly unknown[]): SerializedEditorState => {
  const raw: unknown = {
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  };

  return raw as SerializedEditorState;
};

// A populated upload node: `value` is the resolved Media object carrying `url`
// (depth >= 1). This mirrors what the upload converter reads.
const populatedUpload = (url: string): unknown => ({
  type: 'upload',
  relationTo: 'media',
  format: '',
  version: 3,
  fields: null,
  value: { id: 1, alt: '', url, mimeType: 'image/jpeg', width: 800, height: 600 },
});

describe('firstImageSrc', () => {
  it('returns undefined for an undefined body', () => {
    expect(firstImageSrc(undefined)).toBeUndefined();
  });

  it('returns undefined when the body has no upload nodes', () => {
    expect(firstImageSrc(richTextFromParagraphs(['hello', 'world']))).toBeUndefined();
  });

  it('returns the url of the first populated upload node', () => {
    const body = stateWithChildren([populatedUpload('/media/first.jpg'), populatedUpload('/media/second.jpg')]);
    expect(firstImageSrc(body)).toBe('/media/first.jpg');
  });

  it('skips an unpopulated upload (numeric value) and uses the next populated one', () => {
    const unpopulated: unknown = { type: 'upload', relationTo: 'media', value: 5, version: 3 };
    const body = stateWithChildren([unpopulated, populatedUpload('/media/real.jpg')]);
    expect(firstImageSrc(body)).toBe('/media/real.jpg');
  });

  it('reads a string `src` field when present instead of value.url', () => {
    const imageNode: unknown = { type: 'image', src: '/media/inline.png' };
    const body = stateWithChildren([imageNode]);
    expect(firstImageSrc(body)).toBe('/media/inline.png');
  });

  it('finds an upload nested inside a child node', () => {
    const wrapper: unknown = { type: 'block', children: [{ type: 'paragraph', children: [populatedUpload('/media/nested.jpg')] }] };
    const body = stateWithChildren([wrapper]);
    expect(firstImageSrc(body)).toBe('/media/nested.jpg');
  });

  it('ignores a non-image upload (no url, no src)', () => {
    const fileUpload: unknown = { type: 'upload', value: { id: 2, mimeType: 'application/pdf' } };
    const body = stateWithChildren([fileUpload]);
    expect(firstImageSrc(body)).toBeUndefined();
  });
});
