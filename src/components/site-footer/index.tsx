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
        <a className={styles.colophon} href="/colophon">
          colophon
        </a>
      </span>
    </footer>
  );
};
