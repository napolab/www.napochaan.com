import { describe, expect, it } from 'vitest';

import { toGalleryPhoto } from './index';

import type { Gallery } from '@payload-types';

const media = { id: 1, alt: 'media alt', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' };

const base = { id: 5, image: media, updatedAt: '', createdAt: '' } as unknown as Gallery;

describe('toGalleryPhoto', () => {
  it('maps media src/width/height and falls back to media.alt', () => {
    const photo = toGalleryPhoto(base);
    expect(photo).toEqual({ id: '5', src: '/media/x.jpg', width: 800, height: 600, alt: 'media alt', caption: '' });
  });

  it('prefers the gallery alt override and caption when set', () => {
    const photo = toGalleryPhoto({ ...base, alt: 'override', caption: 'flyer' } as unknown as Gallery);
    expect(photo?.alt).toBe('override');
    expect(photo?.caption).toBe('flyer');
  });

  it('returns undefined when the image is an unpopulated id', () => {
    expect(toGalleryPhoto({ ...base, image: 1 } as unknown as Gallery)).toBeUndefined();
  });
});
