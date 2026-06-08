import * as styles from './styles.css';

type Props = {
  href: string;
  label: string;
};

export const FeedLink = ({ href, label }: Props) => (
  <div className={styles.root}>
    <a className={styles.link} href={href} aria-label={label}>
      rss · feed ↗
    </a>
  </div>
);
