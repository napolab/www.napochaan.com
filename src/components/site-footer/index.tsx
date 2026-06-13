import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { siteNavItems } from '@utils/nav-items';

import * as styles from './styles.css';

type Props = {
  buildId?: string;
};

export const SiteFooter = ({ buildId }: Props) => {
  return (
    <footer className={styles.root}>
      <nav className={styles.nav} aria-label="フッターナビゲーション">
        {siteNavItems.map(({ label, href }) => (
          <Link key={href} href={href} className={styles.navLink} tone="muted">
            <ScrambleText>{label}</ScrambleText>
          </Link>
        ))}
      </nav>
      <div className={styles.meta}>
        <span>© 2026 napochaan — graphic / digital</span>
        <span className={styles.status}>
          build {buildId ?? 'dev'} · <span className={styles.live}>life: running</span> ·{' '}
          <Link href="/colophon" tone="muted">
            <ScrambleText>colophon</ScrambleText>
          </Link>{' '}
          ·{' '}
          <a className={styles.sitemap} href="/sitemap.xml">
            <ScrambleText>sitemap</ScrambleText>
          </a>
        </span>
      </div>
    </footer>
  );
};
