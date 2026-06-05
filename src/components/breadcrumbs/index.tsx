import { Link } from '@components/link';

import * as styles from './styles.css';

type Item = {
  href?: string;
  label: string;
};

type Props = {
  items: readonly Item[];
};

export const Breadcrumbs = ({ items }: Props) => {
  return (
    <nav aria-label="パンくず" className={styles.root}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          if (isLast) {
            return (
              <li key={item.label} className={styles.item} data-first={`${isFirst}`}>
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              </li>
            );
          }

          return (
            <li key={item.label} className={styles.item} data-first={`${isFirst}`}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
