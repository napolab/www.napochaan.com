import { describe, expect, it } from 'vitest';

import { fromGalleryPhotoDTO } from './index';

import type { GalleryPhotoDTO } from '@napochaan/cms-api/services';

const base: GalleryPhotoDTO = { id: 'g1', src: '/g.png', width: 4, height: 3, alt: 'a' };

describe('fromGalleryPhotoDTO', () => {
  // The previous in-process adapter always returned `caption: ''` for a NULL
  // caption, and the archive renders the corner label whenever caption is defined.
  it('maps an omitted caption to an empty string', () => {
    expect(fromGalleryPhotoDTO(base)).toEqual({ ...base, caption: '' });
  });

  it('keeps a present caption', () => {
    expect(fromGalleryPhotoDTO({ ...base, caption: 'VRChat' }).caption).toBe('VRChat');
  });
});
