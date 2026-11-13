import { withAppProviders } from '@components/app-providers';

import { CursorPresenceDemo } from './cursor-presence-demo';
import { IsolatedGameOfLife } from './isolated-game-of-life';

// The colophon's own client leaves ('use client'), placed by ./demo.astro.
export const CursorPresenceDemoIsland = withAppProviders(CursorPresenceDemo);
export const IsolatedGameOfLifeIsland = withAppProviders(IsolatedGameOfLife);
