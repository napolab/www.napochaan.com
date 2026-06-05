'use client';

import { Button, Dialog, DialogTrigger, Modal } from 'react-aria-components';

import { Image } from '@components/image';

import * as styles from './styles.css';

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  span?: 'square' | 'portrait' | 'wide' | 'tall';
};

type Props = {
  items: GalleryItem[];
};

export const Gallery = ({ items }: Props) => {
  return (
    <ul className={styles.root}>
      {items.map((item) => (
        <li key={item.id} className={styles.cell} data-span={item.span ?? 'square'}>
          <DialogTrigger>
            <Button className={styles.trigger} aria-label={item.alt}>
              <Image src={item.src} alt={item.alt} width={item.width} height={item.height} />
            </Button>
            <Modal className={styles.modal}>
              <Dialog className={styles.dialog} aria-label={item.alt}>
                {({ close }) => (
                  <>
                    <Image src={item.src} alt={item.alt} width={item.width} height={item.height} />
                    <Button onPress={close} className={styles.close}>
                      close
                    </Button>
                  </>
                )}
              </Dialog>
            </Modal>
          </DialogTrigger>
        </li>
      ))}
    </ul>
  );
};
