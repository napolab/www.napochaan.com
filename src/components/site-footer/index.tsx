import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import * as styles from './styles.css';

type Props = {
  buildId?: string;
};

export const SiteFooter = ({ buildId }: Props) => {
  return (
    <footer className={styles.root}>
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
    </footer>
  );
};
