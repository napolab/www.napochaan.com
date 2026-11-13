'use client';

import { GameOfLife } from '@components/game-of-life';
import { LifeEngineProvider } from '@components/game-of-life/provider';

// The real GameOfLife on its own engine, so this contained instance never touches the
// background's shared engine (which drives the sys-bar gen count). In Next the client
// boundary was LifeEngineProvider with GameOfLife passed in as RSC children, both in
// one React tree; an Astro slot is a separate root that React context cannot cross,
// so the provider and its consumer are one client leaf here.
export const IsolatedGameOfLife = () => (
  <LifeEngineProvider>
    <GameOfLife />
  </LifeEngineProvider>
);
