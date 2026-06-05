import { GameOfLife } from '@components/game-of-life';
import { TypographyBand } from '@components/typography-band';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

export const SiteShell = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <TypographyBand />
      <GameOfLife />
      <div className={styles.stage}>{children}</div>
    </>
  );
};
