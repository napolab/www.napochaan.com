import { describe, expect, it } from 'vitest';

import { projectWorkRow } from './index';

import type { Work } from '@payload-types';

const base = {
  id: 7,
  slug: 'glitch-study',
  title: 'glitch study',
  type: 'production',
  date: '2025-03-15T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
} as unknown as Work;

describe('projectWorkRow', () => {
  it('maps required fields and stringifies the id', () => {
    const row = projectWorkRow(base, '03');
    expect(row.id).toBe('7');
    expect(row.slug).toBe('glitch-study');
    expect(row.no).toBe('03');
    expect(row.title).toBe('glitch study');
    expect(row.type).toBe('production');
    expect(row.year).toBe(2025);
    expect(row.date).toBe('2025-03-15');
  });

  it('omits NULL url/description/body', () => {
    const row = projectWorkRow({ ...base, url: null, description: null, body: null } as unknown as Work, '01');
    expect(row).not.toHaveProperty('url');
    expect(row).not.toHaveProperty('description');
    expect(row).not.toHaveProperty('bodyJSON');
  });

  it('carries a present body as a JSON string', () => {
    const body = { root: { type: 'root', children: [] } };
    expect(JSON.parse(projectWorkRow({ ...base, body } as unknown as Work, '01').bodyJSON ?? '')).toEqual(body);
  });

  it('derives year from the date field (Asia/Tokyo)', () => {
    // 2024-12-31T15:30Z = 2025-01-01T00:30+09:00 → year 2025 in Asia/Tokyo
    const row = projectWorkRow({ ...base, date: '2024-12-31T15:30:00.000Z' } as unknown as Work, '01');
    expect(row.year).toBe(2025);
    expect(row.date).toBe('2025-01-01');
  });

  it('extracts thumbnail src/width/height from a populated media upload', () => {
    const withThumb = {
      ...base,
      thumbnail: { id: 1, alt: 'x', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' },
    } as unknown as Work;
    expect(projectWorkRow(withThumb, '01').thumbnail).toEqual({ src: '/media/x.jpg', width: 800, height: 600 });
  });

  it('has no thumbnail key when the upload is an unpopulated id or missing', () => {
    expect(projectWorkRow({ ...base, thumbnail: 1 } as unknown as Work, '01')).not.toHaveProperty('thumbnail');
    expect(projectWorkRow(base, '01')).not.toHaveProperty('thumbnail');
  });

  it('maps the SEO meta group (title/description/populated image)', () => {
    const withMeta = {
      ...base,
      meta: { title: 'Meta Title', description: 'meta desc', image: { id: 9, alt: '', url: '/media/og.jpg', updatedAt: '', createdAt: '' } },
    } as unknown as Work;
    expect(projectWorkRow(withMeta, '01').seo).toEqual({ title: 'Meta Title', description: 'meta desc', image: '/media/og.jpg' });
  });

  it('omits seo when meta is absent', () => {
    expect(projectWorkRow(base, '01')).not.toHaveProperty('seo');
  });
});
