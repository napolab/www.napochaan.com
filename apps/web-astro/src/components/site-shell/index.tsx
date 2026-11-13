import { withAppProviders } from '@components/app-providers';
import { CursorPresence } from '@components/cursor-presence';
import { GameOfLife } from '@components/game-of-life';
import { LoadingOverlay } from '@components/loading-overlay';
import { SafeAreaTint } from '@components/safe-area-tint';
import { SiteFooter } from '@components/site-footer';
import { SysBar } from '@components/sys-bar';
import { TypographyBand } from '@components/typography-band';

import * as styles from './styles.css';

// The Next SiteShell wrapped the page in one React tree. On Astro the page <main> is
// swapped by ClientRouter on every navigation, so the shell is split into sibling
// islands placed around `<slot />` by src/layouts/site-layout.astro. The stateful
// ones carry `transition:persist` there (backdrop, cursor layer, boot overlay,
// SysBar); the stage `<div data-cursor-surface>` around the page is plain Astro
// markup. Cross-island state (life engine, boot status, presence, motion) lives in
// module-level stores, so these roots need no shared provider.

// SafeAreaTint first so the TypographyBand (same z token, later in DOM) paints above
// the strip. astro-island is `display: contents`, so both land directly under <body>
// (not positioned) and the strip anchors to the initial containing block.
const ShellBackdrop = () => (
  <>
    <SafeAreaTint />
    <TypographyBand />
    <div className={styles.lifeFrame}>
      <GameOfLife />
    </div>
  </>
);

// No children: the coordinate surface is the Astro-rendered stage, resolved from the
// DOM (see cursor-presence/resolve-surface).
const CursorLayerOnly = () => <CursorPresence>{null}</CursorPresence>;

export const ShellBackdropIsland = withAppProviders(ShellBackdrop);
export const CursorPresenceIsland = withAppProviders(CursorLayerOnly);
export const LoadingOverlayIsland = withAppProviders(LoadingOverlay);
export const SysBarIsland = withAppProviders(SysBar);
export const SiteFooterIsland = withAppProviders(SiteFooter);
