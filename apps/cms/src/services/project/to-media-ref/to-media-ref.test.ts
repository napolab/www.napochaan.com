import { describe, expect, it } from 'vitest';

import { toMediaRef } from './index';

import type { Media } from '@payload-types';

const media = { id: 1, alt: 'x', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' } as Media;

describe('toMediaRef', () => {
  it('maps a populated media to { src, width, height }', () => {
    expect(toMediaRef(media)).toStrictEqual({ src: '/media/x.jpg', width: 800, height: 600 });
  });

  it('returns undefined for an unpopulated id, NULL or undefined', () => {
    expect(toMediaRef(1)).toBeUndefined();
    expect(toMediaRef(null)).toBeUndefined();
    expect(toMediaRef(undefined)).toBeUndefined();
  });

  it('returns undefined when url or a dimension is missing', () => {
    expect(toMediaRef({ ...media, url: null })).toBeUndefined();
    expect(toMediaRef({ ...media, width: null })).toBeUndefined();
    expect(toMediaRef({ ...media, height: undefined })).toBeUndefined();
  });
});
