import { Lightbox } from '@components/gallery/lightbox';
import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import { BlankDim } from './blank-dim';
import { computeBlanks } from './skyline/compute-blanks';
import { spanForAspect } from './skyline/layout';
import { pack } from './skyline/pack';
import * as styles from './styles.css';

import type { Blank } from './skyline/compute-blanks';
import type { Placement } from './skyline/pack';
import type { CSSProperties } from 'react';

export type GalleryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  // Short corner label (e.g. 'flyer / 04.24' or 'VRChat').
  caption?: string;
};

type Props = {
  photos: GalleryPhoto[];
};

// Column counts per breakpoint: base (mobile) / tablet / desktop. The packing is run
// once for each on the server; CSS picks the matching cw-unit coordinates per cell, so
// the layout needs no measurement and never shifts. No 'use client' — pure render.
const COLUMN_COUNTS = [2, 3, 4] as const;

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

// A blank belongs to one breakpoint's layout, so it carries a single position.
const blankVars = (blank: Blank): CSSProperties => ({ '--col': `${blank.col}`, '--y': `${blank.y}`, '--h': `${blank.height}` }) as CSSProperties;

const totalVars = (totals: readonly number[]): CSSProperties => ({ '--total-2': `${totals[0]}`, '--total-3': `${totals[1]}`, '--total-4': `${totals[2]}` }) as CSSProperties;

const refNo = (index: number): string => `${index + 1}`.padStart(2, '0');

const FALLBACK: Placement = { id: '', col: 0, span: 1, y: 0, height: 1 };

export const GalleryArchive = ({ photos }: Props) => {
  const items = photos.map((photo) => ({ id: photo.id, ratio: photo.height / photo.width, span: spanForAspect(photo.width / photo.height) }));

  const layouts = COLUMN_COUNTS.map((cols) => {
    const result = pack(items, cols);

    return { result, blanks: computeBlanks(result.placements, cols, result.totalHeight) };
  });

  // Every photo is placed in every layout; the fallback only keeps the types total.
  const placementOf = (id: string, layoutIndex: number): Placement => layouts[layoutIndex]?.result.placements.find((p) => p.id === id) ?? FALLBACK;

  return (
    <ul className={styles.root} data-gallery style={totalVars(layouts.map((layout) => layout.result.totalHeight))}>
      {photos.map((photo) => (
        <li key={photo.id} className={styles.cell} style={cellVars(placementOf(photo.id, 0), placementOf(photo.id, 1), placementOf(photo.id, 2))}>
          <Lightbox src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} triggerClassName={styles.trigger}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 768px) 25vw, (min-width: 480px) 33vw, 50vw"
              className={styles.image}
              placeholder="blur"
              blurDataURL={formatBlurURL(photo.src, { blur: 10, width: 32, quality: 30 })}
            />
          </Lightbox>
          {photo.caption !== undefined ? <span className={styles.caption}>{photo.caption}</span> : null}
        </li>
      ))}
      {layouts.flatMap((layout, bp) =>
        layout.blanks.map((blank, index) => (
          <li key={`${bp}-${blank.id}`} className={styles.blank} data-bp={bp} style={blankVars(blank)} aria-hidden="true">
            <span className={styles.corner} data-pos="tl">
              +
            </span>
            <span className={styles.corner} data-pos="tr">
              +
            </span>
            <span className={styles.corner} data-pos="bl">
              +
            </span>
            <span className={styles.corner} data-pos="br">
              +
            </span>
            <BlankDim refLabel={refNo(index)} />
          </li>
        )),
      )}
    </ul>
  );
};
