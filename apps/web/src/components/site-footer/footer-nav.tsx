'use client';

import { usePathname } from 'next/navigation';

import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { isNavActive } from '@utils/is-nav-active';
import { siteNavItems } from '@utils/nav-items';

import * as styles from './styles.css';

// The footer's section nav. A client island (it reads the current path to mark the
// active section, like the SysBar) so SiteFooter itself can stay a Server
// Component. Space-separated, no glyph divider; the current page gets the same
// inverted box the header uses; the hover affordance is the scramble.
export const FooterNav = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="フッターナビゲーション">
      {siteNavItems.map(({ label, href }) => (
        <Link key={href} href={href} className={styles.navLink} tone="muted" underline={false} data-active={isNavActive(pathname, href) ? 'true' : undefined}>
          <ScrambleText>{label}</ScrambleText>
        </Link>
      ))}
    </nav>
  );
};
