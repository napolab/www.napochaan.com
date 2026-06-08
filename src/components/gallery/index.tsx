'use client';

import { useMemo } from 'react';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import { Lightbox } from './lightbox';
import * as styles from './styles.css';

import type { CSSProperties } from 'react';

// Named template areas defined by the gallery grid (see styles.css.ts). Each item
// is placed into exactly one, guaranteeing the grid tiles with no empty cells.
export type GalleryArea = 'lead' | 'sub' | 'wide' | 'square' | 'column' | 'inset';

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  area: GalleryArea;
  // Short label rendered as a corner tag over the cell (e.g. 'flyer / 04.24').
  caption?: string;
  // CSS object-position value that frames the cover-crop for this cell. Defaults to 'center'.
  objectPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | `${number}% ${number}%` | `${number}%` | 'initial' | 'inherit' | (string & {});
};

type Props = {
  items: GalleryItem[];
};

const GalleryCell = ({ item }: { item: GalleryItem }) => {
  const cellStyle = useMemo(() => ({ '--gallery-area': item.area, '--gallery-object-position': item.objectPosition ?? 'center' }) as CSSProperties, [item.area, item.objectPosition]);

  return (
    <li className={styles.cell} style={cellStyle}>
      <Lightbox src={item.src} alt={item.alt} width={item.width} height={item.height} triggerClassName={styles.trigger}>
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          className={styles.gridImage}
          placeholder="blur"
          blurDataURL={formatBlurURL(item.src, { blur: 10, width: 32, quality: 30 })}
        />
      </Lightbox>
      {item.caption !== undefined ? <span className={styles.caption}>{item.caption}</span> : null}
    </li>
  );
};

export const Gallery = ({ items }: Props) => {
  return (
    <ul className={styles.root} data-gallery>
      {items.map((item) => (
        <GalleryCell key={item.id} item={item} />
      ))}
    </ul>
  );
};
