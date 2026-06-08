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

// The absolute-position bridge: skyline output is published as CSS custom
// properties (the only style-prop bridge the project allows), consumed by s.cell.
const cellVars = (place: Placement): CSSProperties => ({ '--cell-x': `${place.x}px`, '--cell-y': `${place.y}px`, '--cell-w': `${place.width}px`, '--cell-h': `${place.height}px` }) as CSSProperties;

const totalVars = (totalHeight: number): CSSProperties => ({ '--total-h': `${totalHeight}px` }) as CSSProperties;

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
          <li key={photo.id} className={styles.cell} style={place === undefined ? undefined : cellVars(place)}>
            <Lightbox src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} triggerClassName={styles.trigger}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className={styles.image}
                placeholder="blur"
                blurDataURL={formatBlurURL(photo.src, { width: 16, blur: 20 })}
              />
            </Lightbox>
            {photo.caption !== undefined ? <span className={styles.caption}>{photo.caption}</span> : null}
          </li>
        );
      })}
      {blanks.map((blank) => (
        <li key={blank.id} className={styles.blank} style={cellVars(blank)} aria-hidden="true">
          <svg className={styles.blankMark} viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </li>
      ))}
    </ul>
  );
};
