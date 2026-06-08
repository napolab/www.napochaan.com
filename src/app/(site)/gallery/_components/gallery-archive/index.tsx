'use client';

import { useEffect, useRef, useState } from 'react';

import { Lightbox } from '@components/gallery/lightbox';
import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import { computeBlanks } from './skyline/compute-blanks';
import { resolveColumns, spanForAspect } from './skyline/layout';
import { pack } from './skyline/pack';
import * as styles from './styles.css';

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

const GAP = 2;

// A 2-digit reference number for each blank (deterministic by index).
const refNo = (index: number): string => `${index + 1}`.padStart(2, '0');

// The absolute-position bridge: skyline output is published as CSS custom
// properties (the only style-prop bridge the project allows), consumed by s.cell.
const cellVars = (place: Placement): CSSProperties => ({ '--cell-x': `${place.x}px`, '--cell-y': `${place.y}px`, '--cell-w': `${place.width}px`, '--cell-h': `${place.height}px` }) as CSSProperties;

const totalVars = (totalHeight: number): CSSProperties => ({ '--total-h': `${totalHeight}px` }) as CSSProperties;

// Photo cell style: always publish the aspect ratio (so the flow fallback reserves
// each cell's height and nothing shifts on image load); add the packed position/size
// vars once the width has been measured.
const photoCellStyle = (photo: GalleryPhoto, place: Placement | undefined): CSSProperties =>
  ({ '--cell-ar': `${photo.width} / ${photo.height}`, ...(place === undefined ? {} : cellVars(place)) }) as CSSProperties;

export const GalleryArchive = ({ photos }: Props) => {
  const ref = useRef<HTMLUListElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for imperative ResizeObserver DOM measurement.
    // Cannot use Suspense as this is direct DOM measurement for layout calculation.
    const el = ref.current;
    if (el === null) return;

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (typeof measured === 'number') setWidth(measured);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const columns = width === null ? 0 : resolveColumns(width);
  const result =
    width === null
      ? null
      : pack(
          photos.map((photo) => ({ id: photo.id, width: photo.width, height: photo.height, span: spanForAspect(photo.width / photo.height) })),
          { width, gap: GAP, columns },
        );

  const placementOf = (id: string): Placement | undefined => result?.placements.find((p) => p.id === id);

  // Crosshatch fillers for the ragged bottom and any internal gaps the skyline left,
  // so empty space reads as a drafting hatch rather than blank grid.
  const blanks = result === null || width === null ? [] : computeBlanks(result.placements, { columns, width, gap: GAP, totalHeight: result.totalHeight });

  return (
    <ul ref={ref} className={styles.root} data-mode={result === null ? 'flow' : 'packed'} style={result === null ? undefined : totalVars(result.totalHeight)}>
      {photos.map((photo) => {
        const place = placementOf(photo.id);

        return (
          <li key={photo.id} className={styles.cell} style={photoCellStyle(photo, place)}>
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
        );
      })}
      {blanks.map((blank, index) => (
        <li key={blank.id} className={styles.blank} style={cellVars(blank)} aria-hidden="true">
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
          <span className={styles.blankDim}>{`${Math.round(blank.width)}×${Math.round(blank.height)}\nNO.${refNo(index)}`}</span>
        </li>
      ))}
    </ul>
  );
};
