import { withAppProviders } from '@components/app-providers';
import { CursorPresence } from '@components/cursor-presence';
import { GameOfLife } from '@components/game-of-life';
import { SafeAreaTint } from '@components/safe-area-tint';
import { SysBar } from '@components/sys-bar';
import { TypographyBand } from '@components/typography-band';

import * as styles from './styles.css';

// The Next SiteShell wrapped the page in one React tree. On Astro the page <main> is
// swapped by ClientRouter on every navigation, so src/layouts/site-layout.astro places
// the shell pieces around `<slot />`. Only client leaves ('use client' in the Next app)
// hydrate (.claude/rules/astro-islands.md): SysBar and the cursor layer below, plus the
// leaves inside the `.astro` twins (shell-backdrop.astro, loading-overlay.astro,
// site-footer.astro). The stateful ones carry `transition:persist`. Cross-island state
// (life engine, boot status, presence, motion) lives in module-level stores, so these
// roots need no shared provider.

// Reference markup for shell-backdrop.astro (a Server Component; never hydrated as a
// whole). SafeAreaTint first so the TypographyBand (same z token, later in DOM) paints
// above the strip; both land directly under <body> (not positioned) and the strip
// anchors to the initial containing block.
export const ShellBackdrop = () => (
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

export const CursorPresenceIsland = withAppProviders(CursorLayerOnly);
export const SysBarIsland = withAppProviders(SysBar);
