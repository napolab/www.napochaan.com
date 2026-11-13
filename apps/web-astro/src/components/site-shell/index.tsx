import { CursorPresence } from '@components/cursor-presence';
import { CursorSurface } from '@components/cursor-presence/cursor-surface';
import { GameOfLife } from '@components/game-of-life';
import { LifeEngineProvider } from '@components/game-of-life/provider';
import { MotionProvider } from '@components/motion-provider';
import { SafeAreaTint } from '@components/safe-area-tint';
import { SiteFooter } from '@components/site-footer';
import { SysBar } from '@components/sys-bar';
import { formatClock } from '@components/sys-bar/format-clock';
import { TypographyBand } from '@components/typography-band';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

export const SiteShell = ({ children }: { children: ReactNode }) => {
  // Stamp the clock on the server so SysBar's time renders immediately in SSR.
  // Under ISR this reflects the cache-generation time and snaps to the live clock
  // once SysBar hydrates.
  const initialTime = formatClock();

  return (
    <LifeEngineProvider>
      <MotionProvider>
        <CursorPresence>
          {/* First in the tree so the TypographyBand (same z token, later in DOM)
              paints above the strip. CursorPresence / LifeEngineProvider add no
              DOM wrappers, so this lands directly under <body> (not positioned)
              and the strip anchors to the initial containing block. */}
          <SafeAreaTint />
          <TypographyBand />
          <div className={styles.lifeFrame}>
            <GameOfLife />
          </div>
          <CursorSurface className={styles.stage}>
            <SysBar initialTime={initialTime} />
            {children}
            <SiteFooter />
          </CursorSurface>
        </CursorPresence>
      </MotionProvider>
    </LifeEngineProvider>
  );
};
