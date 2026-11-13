import { describe, expect, it } from 'vitest';

import { segmentRichText } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const text = (value: string) => ({ type: 'text', text: value, format: 0, style: '', mode: 'normal', detail: 0, version: 1 });
const paragraph = (value: string) => ({ type: 'paragraph', children: [text(value)], format: '', indent: 0, version: 1, direction: 'ltr' });
const heading = (tag: string, value: string) => ({ type: 'heading', tag, children: [text(value)], format: '', indent: 0, version: 1, direction: 'ltr' });
const media = { url: '/m/a.jpg', alt: 'alt a', width: 640, height: 360, mimeType: 'image/jpeg' };
const upload = (value: unknown) => ({ type: 'upload', value, fields: { caption: 'cap' }, relationTo: 'media', version: 3, format: '', id: 'u' });
const imageRow = (cells: unknown[]) => ({ type: 'block', fields: { id: 'r', blockType: 'image-row', cells }, format: '', version: 2 });

const doc = (children: unknown[]): SerializedEditorState => JSON.parse(JSON.stringify({ root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }));

describe('segmentRichText', () => {
  it('groups consecutive static nodes into one run that keeps the root envelope', () => {
    const segments = segmentRichText(doc([paragraph('a'), paragraph('b')]));
    expect(segments).toHaveLength(1);
    const [run] = segments;
    expect(run?.kind).toBe('static');
    if (run?.kind !== 'static') return;
    expect(run.data.root.type).toBe('root');
    expect(run.data.root.children).toHaveLength(2);
  });

  it('splits out headings with their level, slug and inline children', () => {
    const segments = segmentRichText(doc([paragraph('a'), heading('h2', 'Hello World'), paragraph('b')]));
    expect(segments.map((segment) => segment.kind)).toEqual(['static', 'heading', 'static']);
    const [, segment] = segments;
    if (segment?.kind !== 'heading') throw new Error('expected a heading');
    expect(segment.level).toBe(2);
    expect(segment.slug).toBe('hello-world');
    expect(segment.inline.root.children).toEqual([text('Hello World')]);
  });

  it('splits out image uploads as zoomable figures; non-image uploads stay static', () => {
    const segments = segmentRichText(doc([upload(media), upload({ url: '/m/a.pdf', filename: 'a.pdf', mimeType: 'application/pdf' })]));
    expect(segments.map((segment) => segment.kind)).toEqual(['upload', 'static']);
    const [segment] = segments;
    if (segment?.kind !== 'upload') throw new Error('expected an upload');
    expect(segment.figure).toEqual({ src: '/m/a.jpg', alt: 'alt a', width: 640, height: 360, caption: 'cap' });
  });

  it('splits out image rows with their populated cells and drops an empty row', () => {
    const segments = segmentRichText(doc([imageRow([{ image: media, caption: 'one' }, { image: 7 }]), imageRow([{ image: 3 }])]));
    expect(segments).toHaveLength(1);
    const [segment] = segments;
    if (segment?.kind !== 'image-row') throw new Error('expected an image row');
    expect(segment.figures).toEqual([{ url: '/m/a.jpg', alt: 'alt a', width: 640, height: 360, caption: 'one' }]);
  });

  it('keeps other blocks (code, youtube) in the static run', () => {
    const code = { type: 'block', fields: { id: 'c', blockType: 'Code', code: 'x', language: 'ts' }, format: '', version: 2 };
    expect(segmentRichText(doc([paragraph('a'), code])).map((segment) => segment.kind)).toEqual(['static']);
  });
});
