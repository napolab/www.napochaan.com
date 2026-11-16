import { breakpoints } from '@themes/breakpoints';
import { CONTENT_MAX_WIDTH_PX } from '@themes/layout';

import { computeBlanks } from './skyline/compute-blanks';
import { spanForAspect } from './skyline/layout';
import { pack } from './skyline/pack';

import type { GalleryPhoto } from './index';
import type { Blank } from './skyline/compute-blanks';
import type { Placement } from './skyline/pack';
import type { CSSProperties } from 'react';

// The GalleryArchive layout as data, shared by the React Server Component (./index.tsx)
// and its `.astro` twin (./gallery-archive.astro) so both render the same packing.

// Column counts per breakpoint: base (mobile) / tablet / desktop. The packing is run
// once for each on the server; CSS picks the matching cw-unit coordinates per cell, so
// the layout needs no measurement and never shifts.
const COLUMN_COUNTS = [2, 3, 4] as const;

export const ARCHIVE_BLUR_OPTIONS = { blur: 10, width: 32, quality: 30 } as const;

// Horizontal gutters of the site-shell `stage` around the content box: band (24px) +
// 8px a side below the desktop breakpoint, band + 24px a side from 768px
// (src/components/site-shell/styles.css.ts). The safe-area insets only ever narrow it.
const GUTTERS_PX = { narrow: 64, desktop: 96 } as const;

// The real slot of a cell spanning `span` columns: the content box split into 2 / 3 / 4
// columns per breakpoint, capped by the 1180px column. A blanket 25vw / 33vw / 50vw
// over-fetched one-column cells (50vw on a 412px phone is ~60px wider than the slot)
// and under-fetched the two-column wide ones.
export const archiveImageSizes = (span: number): string => {
  const times = span === 1 ? '' : ` * ${span}`;
  const capped = Math.round(((CONTENT_MAX_WIDTH_PX - GUTTERS_PX.desktop) / 4) * span);

  return [
    `(min-width: ${CONTENT_MAX_WIDTH_PX}px) ${capped}px`,
    `(min-width: ${breakpoints.desktop}) calc((100vw - ${GUTTERS_PX.desktop}px)${times} / 4)`,
    `(min-width: ${breakpoints.tablet}) calc((100vw - ${GUTTERS_PX.narrow}px)${times} / 3)`,
    `calc((100vw - ${GUTTERS_PX.narrow}px)${times} / 2)`,
  ].join(', ');
};

export type ArchiveCell = { photo: GalleryPhoto; style: CSSProperties; sizes: string };
export type ArchiveBlank = { key: string; blank: Blank; bp: number; index: number };
export type ArchiveLayout = { rootStyle: CSSProperties; cells: ArchiveCell[]; blanks: ArchiveBlank[] };

// Publish each photo's cw-unit position/size for all three column counts; the cell CSS
// selects the active set per breakpoint and scales it with --cw (= 100cqw / cols).
const cellVars = (p2: Placement, p3: Placement, p4: Placement): CSSProperties =>
  ({
    '--col-2': `${p2.col}`,
    '--span-2': `${p2.span}`,
    '--y-2': `${p2.y}`,
    '--h-2': `${p2.height}`,
    '--col-3': `${p3.col}`,
    '--span-3': `${p3.span}`,
    '--y-3': `${p3.y}`,
    '--h-3': `${p3.height}`,
    '--col-4': `${p4.col}`,
    '--span-4': `${p4.span}`,
    '--y-4': `${p4.y}`,
    '--h-4': `${p4.height}`,
  }) as CSSProperties;

const totalVars = (totals: readonly number[]): CSSProperties => ({ '--total-2': `${totals[0]}`, '--total-3': `${totals[1]}`, '--total-4': `${totals[2]}` }) as CSSProperties;

const FALLBACK: Placement = { id: '', col: 0, span: 1, y: 0, height: 1 };

export const galleryArchiveLayout = (photos: readonly GalleryPhoto[]): ArchiveLayout => {
  const items = photos.map((photo) => ({ id: photo.id, ratio: photo.height / photo.width, span: spanForAspect(photo.width / photo.height) }));

  const layouts = COLUMN_COUNTS.map((cols) => {
    const result = pack(items, cols);

    return { result, blanks: computeBlanks(result.placements, cols, result.totalHeight) };
  });

  // Every photo is placed in every layout; the fallback only keeps the types total.
  const placementOf = (id: string, layoutIndex: number): Placement => layouts[layoutIndex]?.result.placements.find((p) => p.id === id) ?? FALLBACK;

  return {
    rootStyle: totalVars(layouts.map((layout) => layout.result.totalHeight)),
    cells: photos.map((photo) => ({
      photo,
      style: cellVars(placementOf(photo.id, 0), placementOf(photo.id, 1), placementOf(photo.id, 2)),
      sizes: archiveImageSizes(spanForAspect(photo.width / photo.height)),
    })),
    blanks: layouts.flatMap((layout, bp) => layout.blanks.map((blank, index) => ({ key: `${bp}-${blank.id}`, blank, bp, index }))),
  };
};
