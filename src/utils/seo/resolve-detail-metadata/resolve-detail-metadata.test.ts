import { describe, expect, it } from 'vitest';

import { resolveDetailMetadata } from '.';

import { richTextFromParagraphs } from '@utils/sample-rich-text';

describe('resolveDetailMetadata', () => {
  it('uses meta.title as an absolute title and the display title in og/twitter', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc title',
      path: '/works/sample',
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
      path: '/works/sample',
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
      path: '/works/sample',
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
      path: '/works/sample',
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
      path: '/works/sample',
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
      path: '/works/sample',
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
      path: '/works/sample',
      genericDescription: 'お知らせ',
      defaultImage: '/og-default.png',
    });

    expect(meta.description).toBe('お知らせ');
  });

  it('emits the shared site-wide og fields, og:url from path, and the large twitter card', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'doc',
      path: '/works/w1',
      genericDescription: 'works',
      defaultImage: '/og-default.png',
    });

    const openGraph = meta.openGraph;
    const type = openGraph !== null && openGraph !== undefined && 'type' in openGraph ? openGraph.type : undefined;
    expect(type).toBe('website');
    expect(openGraph?.siteName).toBe('napochaan');
    expect(openGraph?.locale).toBe('ja_JP');
    expect(openGraph?.url).toBe('/works/w1');

    const twitter = meta.twitter;
    const card = twitter !== null && twitter !== undefined && 'card' in twitter ? twitter.card : undefined;
    expect(card).toBe('summary_large_image');

    expect(meta.alternates?.canonical).toBe('/works/w1');
  });

  it('does not emit explicit og/twitter images (file-convention owns them)', () => {
    const meta = resolveDetailMetadata({
      docTitle: 'Example',
      path: '/works/1',
      genericDescription: 'works',
      defaultImage: '/og-default.png',
    });
    expect(meta.openGraph !== null && meta.openGraph !== undefined && 'images' in meta.openGraph ? meta.openGraph.images : undefined).toBeUndefined();
    expect(meta.twitter !== null && meta.twitter !== undefined && 'images' in meta.twitter ? meta.twitter.images : undefined).toBeUndefined();
  });
});
