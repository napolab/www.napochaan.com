import { CursorPresence } from '@components/cursor-presence';
import { GameOfLife } from '@components/game-of-life';
import { LifeEngineProvider } from '@components/game-of-life/provider';
import { SiteFooter } from '@components/site-footer';
import { SysBar } from '@components/sys-bar';
import { TypographyBand } from '@components/typography-band';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

export const SiteShell = ({ children }: { children: ReactNode }) => {
  return (
    <LifeEngineProvider>
      <CursorPresence>
        <TypographyBand />
        <GameOfLife />
        <div className={styles.stage} data-cursor-surface>
          <SysBar />
          {children}
          <SiteFooter />
        </div>
      </CursorPresence>
    </LifeEngineProvider>
  );
};
