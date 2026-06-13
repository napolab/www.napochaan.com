import { describe, expect, it } from 'vitest';

import { toBlogPost } from './index';

import type { Blog } from '@payload-types';

// A lexical body with ~10 chars of text → readingMinutes returns 1 (min).
const body = {
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: '十文字ほどの本文' }] }] },
} as unknown as Blog['body'];

const base = {
  id: 3,
  slug: 'panda-css-design-token',
  title: 'Panda CSS で作る design token',
  publishedAt: '2026-05-10T00:00:00.000Z',
  excerpt: 'OKLCH の話',
  body,
  updatedAt: '',
  createdAt: '',
} as unknown as Blog;

describe('toBlogPost', () => {
  it('maps fields, stringifies id, formats date as YYYY-MM-DD', () => {
    const post = toBlogPost(base, '02');
    expect(post.id).toBe('3');
    expect(post.slug).toBe('panda-css-design-token');
    expect(post.index).toBe('02');
    expect(post.title).toBe('Panda CSS で作る design token');
    expect(post.date).toBe('2026-05-10');
    expect(post.excerpt).toBe('OKLCH の話');
  });

  it('derives readMin from the body (minimum 1)', () => {
    expect(toBlogPost(base, '01').readMin).toBe(1);
  });

  it('maps the SEO meta group (title/description/populated image)', () => {
    const withMeta = {
      ...base,
      meta: { title: 'Meta Title', description: 'meta desc', image: { id: 9, alt: '', url: '/media/og.jpg', updatedAt: '', createdAt: '' } },
    } as unknown as Blog;
    expect(toBlogPost(withMeta, '01').seo).toEqual({ title: 'Meta Title', description: 'meta desc', image: '/media/og.jpg' });
  });

  it('leaves seo undefined when meta is absent', () => {
    expect(toBlogPost(base, '01').seo).toBeUndefined();
  });

  it('omits the seo image when meta.image is an unpopulated id', () => {
    const withMeta = { ...base, meta: { title: 'T', image: 7 } } as unknown as Blog;
    expect(toBlogPost(withMeta, '01').seo).toEqual({ title: 'T', description: undefined, image: undefined });
  });

  it('maps a populated thumbnail to { src, width, height }', () => {
    const withThumb = {
      ...base,
      thumbnail: { id: 5, alt: '', url: '/media/top.png', width: 1280, height: 720, updatedAt: '', createdAt: '' },
    } as unknown as Blog;
    expect(toBlogPost(withThumb, '01').thumbnail).toEqual({ src: '/media/top.png', width: 1280, height: 720 });
  });

  it('leaves thumbnail undefined when it is an unpopulated id', () => {
    const withThumb = { ...base, thumbnail: 5 } as unknown as Blog;
    expect(toBlogPost(withThumb, '01').thumbnail).toBeUndefined();
  });

  it('leaves thumbnail undefined when absent', () => {
    expect(toBlogPost(base, '01').thumbnail).toBeUndefined();
  });
});
