import { describe, expect, it } from 'vitest';

import { projectPost } from './index';

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

describe('projectPost', () => {
  it('maps fields, stringifies id, formats date as YYYY-MM-DD', () => {
    const post = projectPost(base, '02');
    expect(post.id).toBe('3');
    expect(post.slug).toBe('panda-css-design-token');
    expect(post.index).toBe('02');
    expect(post.title).toBe('Panda CSS で作る design token');
    expect(post.date).toBe('2026-05-10');
    expect(post.excerpt).toBe('OKLCH の話');
  });

  it('derives readMin from the body (minimum 1)', () => {
    expect(projectPost(base, '01').readMin).toBe(1);
  });

  it('carries the Lexical body as a JSON string', () => {
    expect(JSON.parse(projectPost(base, '01').bodyJSON ?? '')).toEqual(body);
  });

  it('keeps a populated upload node in bodyJSON untouched (no URL rewriting)', () => {
    const media = { id: 11, url: '/api/media/file/a.png', width: 800, height: 600, alt: 'a', mimeType: 'image/png', filename: 'a.png' };
    const withUpload = {
      ...base,
      body: { root: { type: 'root', children: [{ type: 'upload', relationTo: 'media', value: media, fields: null }] } },
    } as unknown as Blog;

    const parsed: unknown = JSON.parse(projectPost(withUpload, '01').bodyJSON ?? '');
    expect(parsed).toEqual(withUpload.body);
    expect(parsed).toMatchObject({ root: { children: [{ value: media }] } });
  });

  it('omits bodyJSON when the body is NULL', () => {
    expect(projectPost({ ...base, body: null } as unknown as Blog, '01')).not.toHaveProperty('bodyJSON');
  });

  it('maps the SEO meta group (title/description/populated image)', () => {
    const withMeta = {
      ...base,
      meta: { title: 'Meta Title', description: 'meta desc', image: { id: 9, alt: '', url: '/media/og.jpg', updatedAt: '', createdAt: '' } },
    } as unknown as Blog;
    expect(projectPost(withMeta, '01').seo).toEqual({ title: 'Meta Title', description: 'meta desc', image: '/media/og.jpg' });
  });

  it('omits seo when meta is absent', () => {
    expect(projectPost(base, '01')).not.toHaveProperty('seo');
  });

  it('omits the seo image when meta.image is an unpopulated id', () => {
    const withMeta = { ...base, meta: { title: 'T', image: 7 } } as unknown as Blog;
    expect(projectPost(withMeta, '01').seo).toEqual({ title: 'T' });
  });

  it('maps a populated thumbnail to { src, width, height }', () => {
    const withThumb = {
      ...base,
      thumbnail: { id: 5, alt: '', url: '/media/top.png', width: 1280, height: 720, updatedAt: '', createdAt: '' },
    } as unknown as Blog;
    expect(projectPost(withThumb, '01').thumbnail).toEqual({ src: '/media/top.png', width: 1280, height: 720 });
  });

  it('has no thumbnail key when the thumbnail is an unpopulated id', () => {
    const withThumb = { ...base, thumbnail: 5 } as unknown as Blog;
    expect(projectPost(withThumb, '01')).not.toHaveProperty('thumbnail');
  });

  it('has no thumbnail key when absent', () => {
    expect(projectPost(base, '01')).not.toHaveProperty('thumbnail');
  });
});
