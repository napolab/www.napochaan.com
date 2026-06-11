'use client';

import * as styles from './no-action.css';

import type { MouseEvent, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
  event.preventDefault();
};

// Colophon rule: showcased links keep a realistic href but must never navigate.
// Capture-phase preventDefault stops native anchors and react-aria Links alike
// (RAC checks isDefaultPrevented before invoking the client router).
export const NoAction = ({ children }: Props) => (
  <div className={styles.root} onClickCapture={handleClickCapture}>
    {children}
  </div>
);
