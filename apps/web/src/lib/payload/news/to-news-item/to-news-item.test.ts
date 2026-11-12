import { describe, expect, it } from 'vitest';

import { toNewsItem } from './index';

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

describe('toNewsItem', () => {
  it('stringifies the numeric id', () => {
    expect(toNewsItem(makeDoc({ id: 42 })).id).toBe('42');
  });

  it('carries slug through from the document', () => {
    expect(toNewsItem(makeDoc({ slug: 'title-news' })).slug).toBe('title-news');
  });

  it('formats publishedAt as YYYY-MM-DD in Asia/Tokyo', () => {
    // 2026-06-05T16:00:00Z is 2026-06-06 01:00 JST — the date must roll forward.
    const item = toNewsItem(makeDoc({ publishedAt: '2026-06-05T16:00:00.000Z' }));
    expect(item.date).toBe('2026-06-06');
  });

  it('coerces null url to undefined', () => {
    expect(toNewsItem(makeDoc({ url: null })).url).toBeUndefined();
  });

  it('coerces empty-string url to undefined', () => {
    // Payload stores a cleared text field as '' (not null). Treat it as absent so
    // consumers fall back to the internal /news/{id} detail link.
    expect(toNewsItem(makeDoc({ url: '' })).url).toBeUndefined();
  });

  it('keeps a present url', () => {
    expect(toNewsItem(makeDoc({ url: '/works' })).url).toBe('/works');
  });

  it('coerces null body to undefined', () => {
    expect(toNewsItem(makeDoc({ body: null })).body).toBeUndefined();
  });

  it('passes through title and category', () => {
    const item = toNewsItem(makeDoc({ title: 'お知らせ', category: 'dj' }));
    expect(item.title).toBe('お知らせ');
    expect(item.category).toBe('dj');
  });

  it('maps the SEO meta group (title/description/populated image)', () => {
    const meta = { title: 'Meta Title', description: 'meta desc', image: { id: 9, alt: '', url: '/media/og.jpg', updatedAt: '', createdAt: '' } } as News['meta'];
    expect(toNewsItem(makeDoc({ meta })).seo).toEqual({ title: 'Meta Title', description: 'meta desc', image: '/media/og.jpg' });
  });

  it('leaves seo undefined when meta is absent', () => {
    expect(toNewsItem(makeDoc({})).seo).toBeUndefined();
  });

  it('omits the seo image when meta.image is an unpopulated id', () => {
    const meta = { title: 'T', image: 7 } as News['meta'];
    expect(toNewsItem(makeDoc({ meta })).seo).toEqual({ title: 'T', description: undefined, image: undefined });
  });
});
