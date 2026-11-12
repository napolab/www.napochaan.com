import { describe, expect, it } from 'vitest';

import { projectGalleryPhoto } from './index';

import type { Gallery } from '@payload-types';

const media = { id: 1, alt: 'media alt', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' };

const base = { id: 5, image: media, updatedAt: '', createdAt: '' } as unknown as Gallery;

describe('projectGalleryPhoto', () => {
  it('maps media src/width/height, falls back to media.alt and omits an absent caption', () => {
    expect(projectGalleryPhoto(base)).toStrictEqual({ id: '5', src: '/media/x.jpg', width: 800, height: 600, alt: 'media alt' });
  });

  it('prefers the gallery alt override and caption when set', () => {
    const photo = projectGalleryPhoto({ ...base, alt: 'override', caption: 'flyer' } as unknown as Gallery);
    expect(photo?.alt).toBe('override');
    expect(photo?.caption).toBe('flyer');
  });

  it('returns undefined when the image is an unpopulated id', () => {
    expect(projectGalleryPhoto({ ...base, image: 1 } as unknown as Gallery)).toBeUndefined();
  });

  it('returns undefined when the media lacks dimensions', () => {
    expect(projectGalleryPhoto({ ...base, image: { ...media, width: null } } as unknown as Gallery)).toBeUndefined();
  });
});
