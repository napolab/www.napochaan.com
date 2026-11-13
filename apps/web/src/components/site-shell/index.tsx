import { GameOfLife } from '@components/game-of-life';
import { SafeAreaTint } from '@components/safe-area-tint';
import { TypographyBand } from '@components/typography-band';

import * as styles from './styles.css';

// The Next SiteShell wrapped the page in one React tree. On Astro the page <main> is
// swapped by ClientRouter on every navigation, so src/layouts/site-layout.astro places
// the shell pieces around `<slot />`: shell-backdrop.astro, sys-bar.astro and
// cursor-presence.astro, plus loading-overlay.astro and site-footer.astro. None
// hydrates React — every interactive piece is a custom element
// (.claude/rules/astro-islands.md), and the stateful ones carry `transition:persist`.
// Cross-element state (life engine, boot status, presence, motion) lives in
// framework-free module stores.

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
