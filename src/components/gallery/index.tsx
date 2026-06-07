'use client';

import { useMemo } from 'react';
import { Button, Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

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
  // CSS object-position value (e.g. 'top', 'center', '50% 20%') that frames the
  // cover-crop for this cell. Defaults to 'center'.
  objectPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | `${number}% ${number}%` | `${number}%` | 'initial' | 'inherit' | (string & {});
};

type Props = {
  items: GalleryItem[];
};

const GalleryCell = ({ item }: { item: GalleryItem }) => {
  const cellStyle = useMemo(() => ({ '--gallery-area': item.area, '--gallery-object-position': item.objectPosition ?? 'center' }) as CSSProperties, [item.area, item.objectPosition]);

  return (
    <li className={styles.cell} style={cellStyle}>
      <DialogTrigger>
        <Button className={styles.trigger} aria-label={item.alt}>
          <Image src={item.src} alt={item.alt} width={item.width} height={item.height} className={styles.gridImage} placeholder="blur" blurDataURL={formatBlurURL(item.src, { width: 16, blur: 20 })} />
        </Button>
        <ModalOverlay className={styles.overlay} isDismissable data-testid="gallery-overlay">
          <Modal className={styles.modal}>
            <Dialog className={styles.dialog} aria-label={item.alt}>
              {({ close }) => (
                <>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    className={styles.modalImage}
                    placeholder="blur"
                    blurDataURL={formatBlurURL(item.src, { width: 16, blur: 20 })}
                  />
                  <Button onPress={close} className={styles.close}>
                    close
                  </Button>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
      {item.caption !== undefined ? <span className={styles.caption}>{item.caption}</span> : null}
    </li>
  );
};

export const Gallery = ({ items }: Props) => {
  return (
    <ul className={styles.root}>
      {items.map((item) => (
        <GalleryCell key={item.id} item={item} />
      ))}
    </ul>
  );
};
