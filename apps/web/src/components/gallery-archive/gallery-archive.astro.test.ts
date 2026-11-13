import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './gallery-archive.astro';
import { GalleryArchive } from './index';

import type { GalleryPhoto } from './index';

// Mixed aspects so every column count packs differently and leaves blanks.
const photos: GalleryPhoto[] = [
  { id: 'g1', src: '/api/media/file/a.png', width: 800, height: 1200, alt: 'tall flyer', caption: 'flyer / 04.24' },
  { id: 'g2', src: '/api/media/file/b.jpg', width: 1600, height: 900, alt: 'wide shot', caption: 'VRChat' },
  { id: 'g3', src: '/api/media/file/c.jpg', width: 1000, height: 1000, alt: 'square' },
  { id: 'g4', src: '/api/media/file/d.jpg', width: 900, height: 1600, alt: 'portrait', caption: '' },
];

describe('gallery-archive.astro', () => {
  it('renders the same markup as the GalleryArchive Server Component', async () => {
    const html = await renderComponent(Twin, { props: { photos } });
    expect(stripIslands(html)).toBe(renderReactMarkup(GalleryArchive, { photos }));
  });

  it('hydrates only the lightboxes and the blank dimension labels', async () => {
    const html = await renderComponent(Twin, { props: { photos } });
    const islands = [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1]);
    expect(islands.filter((name) => name === 'LightboxIsland')).toHaveLength(photos.length);
    expect(islands.filter((name) => name !== 'LightboxIsland').every((name) => name === 'BlankDimIsland')).toBe(true);
    expect(islands).toContain('BlankDimIsland');
  });
});
