'use client';

import { Button, Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  // The layout-owned class for the trigger button (editorial vs masonry differ).
  triggerClassName: string;
  // The thumbnail rendered inside the trigger (each layout styles its own crop).
  children: ReactNode;
};

export const Lightbox = ({ src, alt, width, height, triggerClassName, children }: Props) => {
  return (
    <DialogTrigger>
      <Button className={triggerClassName} aria-label={alt}>
        {children}
      </Button>
      <ModalOverlay className={styles.overlay} isDismissable data-testid="gallery-overlay">
        <Modal className={styles.modal}>
          <Dialog className={styles.dialog} aria-label={alt}>
            {({ close }) => (
              <>
                <Image src={src} alt={alt} width={width} height={height} className={styles.modalImage} placeholder="blur" blurDataURL={formatBlurURL(src, { blur: 10, width: 32, quality: 30 })} />
                <Button onPress={close} className={styles.close}>
                  close
                </Button>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
