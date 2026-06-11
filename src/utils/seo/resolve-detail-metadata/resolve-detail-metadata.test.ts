import { describe, expect, it } from 'vitest';

import { resolveDetailMetadata } from '.';

import { richTextFromBlocks, richTextFromParagraphs } from '@utils/sample-rich-text';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// A populated-upload body the renderer would consume: one image followed by text.
const bodyWithImage = (): SerializedEditorState => {
  const raw: unknown = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        { type: 'upload', relationTo: 'media', value: { id: 1, alt: '', url: '/media/body.jpg' }, version: 3 },
        { type: 'paragraph', children: [{ type: 'text', text: 'a fairly long body paragraph that should be truncated' }] },
      ],
    },
  };

  return raw as SerializedEditorState;
};

describe('resolveDetailMetadata', () => {
  it('uses meta.title as an absolute title and the display title in og/twitter', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc title',
      seo: { title: 'Admin Title' },
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.title).toEqual({ absolute: 'Admin Title' });
    expect(meta.openGraph?.title).toBe('Admin Title');
    expect(meta.twitter?.title).toBe('Admin Title');
  });

  it('falls back to docTitle as a template-able title with display title appending the suffix', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc title',
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.title).toBe('doc title');
    expect(meta.openGraph?.title).toBe('doc title — napochaan');
    expect(meta.twitter?.title).toBe('doc title — napochaan');
  });

  it('prefers meta.description over every other candidate', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      seo: { description: 'admin description' },
      descriptionCandidates: ['field description'],
      body: richTextFromParagraphs(['body text']),
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.description).toBe('admin description');
  });

  it('falls back to a non-empty field candidate when meta.description is absent', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      descriptionCandidates: [undefined, '', 'field description'],
      body: richTextFromParagraphs(['body text']),
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.description).toBe('field description');
  });

  it('derives the description from the body when meta and field candidates are empty', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      body: richTextFromParagraphs(['  derived   body  text  ']),
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.description).toBe('derived body text');
  });

  it('collapses whitespace and truncates a long body excerpt to a boundary with an ellipsis', () => {
    const long = `${'word '.repeat(60)}`.trim();
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      body: richTextFromParagraphs([long]),
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    const description = meta.description ?? '';
    expect(description.endsWith('…')).toBe(true);
    expect(description.length).toBeLessThanOrEqual(122);
    expect(description.includes('  ')).toBe(false);
  });

  it('falls back to the generic description when nothing else is available', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.description).toBe('お知らせ');
  });

  it('prefers meta.image and emits it on og and twitter', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      seo: { image: '/media/admin.jpg' },
      imageCandidates: ['/media/field.jpg'],
      body: bodyWithImage(),
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.openGraph?.images).toEqual([{ url: '/media/admin.jpg' }]);
    expect(meta.twitter?.images).toEqual(['/media/admin.jpg']);
  });

  it('falls back to a field image candidate when meta.image is absent', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      imageCandidates: [undefined, '/media/field.jpg'],
      body: bodyWithImage(),
      genericDescription: 'works',
      defaultImage: '/og-default.png',
    });

    expect(meta.openGraph?.images).toEqual([{ url: '/media/field.jpg' }]);
  });

  it('falls back to the first body image when meta and field images are absent', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      body: bodyWithImage(),
      genericDescription: '記事',
      defaultImage: '/og-default.png',
    });

    expect(meta.openGraph?.images).toEqual([{ url: '/media/body.jpg' }]);
  });

  it('falls back to the default image when no source is available', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      body: richTextFromBlocks([{ type: 'p', text: 'no image here' }]),
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.openGraph?.images).toEqual([{ url: '/og-default.png' }]);
    expect(meta.twitter?.images).toEqual(['/og-default.png']);
  });
});
