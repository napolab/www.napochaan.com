import { describe, expect, it } from 'vitest';

import { toWorkItem } from './index';

import type { Work } from '@payload-types';

const base = {
  id: 7,
  title: 'glitch study',
  type: 'graphic',
  year: 2025,
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
} as unknown as Work;

describe('toWorkItem', () => {
  it('maps required fields and stringifies the id', () => {
    const row = toWorkItem(base, '03');
    expect(row.id).toBe('7');
    expect(row.no).toBe('03');
    expect(row.title).toBe('glitch study');
    expect(row.type).toBe('graphic');
    expect(row.year).toBe(2025);
  });

  it('coerces NULL url/description/body to undefined', () => {
    const row = toWorkItem({ ...base, url: null, description: null, body: null } as unknown as Work, '01');
    expect(row.url).toBeUndefined();
    expect(row.description).toBeUndefined();
    expect(row.body).toBeUndefined();
  });

  it('extracts thumbnail src/width/height from a populated media upload', () => {
    const withThumb = {
      ...base,
      thumbnail: { id: 1, alt: 'x', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' },
    } as unknown as Work;
    const row = toWorkItem(withThumb, '01');
    expect(row.thumbnail).toEqual({ src: '/media/x.jpg', width: 800, height: 600 });
  });

  it('omits thumbnail when the upload is an unpopulated id or missing', () => {
    expect(toWorkItem({ ...base, thumbnail: 1 } as unknown as Work, '01').thumbnail).toBeUndefined();
    expect(toWorkItem(base, '01').thumbnail).toBeUndefined();
  });
});
