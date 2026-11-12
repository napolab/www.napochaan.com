import { describe, expect, it } from 'vitest';

import { projectNewsItem } from './index';

import type { News } from '@payload-types';

// Minimal valid News doc factory. The generated type carries many auto fields
// (createdAt/updatedAt/_status/sizes...) that the mapper ignores; we cast the
// partial literal once at the test boundary.
const makeDoc = (overrides: Partial<News>): News =>
  ({
    id: 1,
    slug: 'title-news',
    title: 'タイトル',
    publishedAt: '2026-06-05T00:00:00.000Z',
    category: 'site',
    url: null,
    body: null,
    updatedAt: '2026-06-05T00:00:00.000Z',
    createdAt: '2026-06-05T00:00:00.000Z',
    _status: 'published',
    ...overrides,
  }) as News;

describe('projectNewsItem', () => {
  it('stringifies the numeric id', () => {
    expect(projectNewsItem(makeDoc({ id: 42 })).id).toBe('42');
  });

  it('carries slug through from the document', () => {
    expect(projectNewsItem(makeDoc({ slug: 'title-news' })).slug).toBe('title-news');
  });

  it('formats publishedAt as YYYY-MM-DD in Asia/Tokyo', () => {
    // 2026-06-05T16:00:00Z is 2026-06-06 01:00 JST — the date must roll forward.
    expect(projectNewsItem(makeDoc({ publishedAt: '2026-06-05T16:00:00.000Z' })).date).toBe('2026-06-06');
  });

  it('omits url when NULL', () => {
    expect(projectNewsItem(makeDoc({ url: null }))).not.toHaveProperty('url');
  });

  it('omits url when it is an empty string', () => {
    // Payload stores a cleared text field as '' (not null). Treat it as absent so
    // consumers fall back to the internal /news/{id} detail link.
    expect(projectNewsItem(makeDoc({ url: '' }))).not.toHaveProperty('url');
  });

  it('keeps a present url', () => {
    expect(projectNewsItem(makeDoc({ url: '/works' })).url).toBe('/works');
  });

  it('omits bodyJSON when the body is NULL', () => {
    expect(projectNewsItem(makeDoc({ body: null }))).not.toHaveProperty('bodyJSON');
  });

  it('carries a present body as a JSON string', () => {
    const body = { root: { type: 'root', children: [] } } as unknown as News['body'];
    expect(JSON.parse(projectNewsItem(makeDoc({ body })).bodyJSON ?? '')).toEqual(body);
  });

  it('passes through title and category', () => {
    const item = projectNewsItem(makeDoc({ title: 'お知らせ', category: 'dj' }));
    expect(item.title).toBe('お知らせ');
    expect(item.category).toBe('dj');
  });

  it('maps the SEO meta group (title/description/populated image)', () => {
    const meta = { title: 'Meta Title', description: 'meta desc', image: { id: 9, alt: '', url: '/media/og.jpg', updatedAt: '', createdAt: '' } } as News['meta'];
    expect(projectNewsItem(makeDoc({ meta })).seo).toEqual({ title: 'Meta Title', description: 'meta desc', image: '/media/og.jpg' });
  });

  it('omits seo when meta is absent', () => {
    expect(projectNewsItem(makeDoc({}))).not.toHaveProperty('seo');
  });
});
