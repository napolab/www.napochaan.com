import { describe, expect, it } from 'vitest';

import { archiveImageSizes, galleryArchiveLayout } from './archive-layout';

import type { GalleryPhoto } from './index';

const photo = (id: string, width: number, height: number): GalleryPhoto => ({ id, src: `/${id}.jpg`, alt: id, width, height });

describe('archiveImageSizes', () => {
  // The cell is a column of the content box: the viewport minus the stage gutters
  // (band + 8px a side on phones / tablets, band + 24px from 768px), capped by the
  // 1180px column. 2 / 3 / 4 columns per breakpoint.
  it('sizes a one-column cell to the real column width per breakpoint', () => {
    expect(archiveImageSizes(1)).toBe('(min-width: 1180px) 271px, (min-width: 768px) calc((100vw - 96px) / 4), (min-width: 480px) calc((100vw - 64px) / 3), calc((100vw - 64px) / 2)');
  });

  it('doubles the slot for a two-column (wide) cell', () => {
    expect(archiveImageSizes(2)).toBe('(min-width: 1180px) 542px, (min-width: 768px) calc((100vw - 96px) * 2 / 4), (min-width: 480px) calc((100vw - 64px) * 2 / 3), calc((100vw - 64px) * 2 / 2)');
  });
});

describe('galleryArchiveLayout', () => {
  it('gives each cell the sizes of its column span', () => {
    const { cells } = galleryArchiveLayout([photo('portrait', 800, 1200), photo('wide', 1920, 1080)]);

    expect(cells.map((cell) => cell.sizes)).toEqual([archiveImageSizes(1), archiveImageSizes(2)]);
  });
});
