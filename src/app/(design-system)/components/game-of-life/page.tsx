import { css } from '@styled/css';

import { GameOfLife } from '@components/game-of-life';
import { LifeEngineProvider } from '@components/game-of-life/provider';

const wrap = css({ position: 'relative', zIndex: 'dropdown', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });

const GameOfLifeShowcase = () => {
  return (
    <LifeEngineProvider>
      <GameOfLife />
      <main className={wrap}>
        <h1 className={heading}>GameOfLife</h1>
        <section aria-label="Preview">
          <p className={caption}>
            A decorative Conway&apos;s Game of Life canvas rendered at position:fixed with inset:24px (inside the 4-edge typography band). It runs at ~7fps, pauses while the tab is hidden, and draws
            one static generation under prefers-reduced-motion. The simulation runs in a headless engine injected via LifeEngineProvider; cleanup (rAF + visibilitychange listener) runs on unmount.
          </p>
        </section>
      </main>
    </LifeEngineProvider>
  );
};

export default GameOfLifeShowcase;
