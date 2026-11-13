import * as styles from './styles.css';

type Props = {
  items: readonly { no: string; term: string; description: string }[];
};

// A clinical observation chart ("カルテ"): a list of findings, each a mono
// finding-marker plus a bold headline (dt) followed by its note (dd). A <dl>
// keeps "finding → note" semantic without adding heading elements under the
// section's h2.
export const Manifesto = ({ items }: Props) => {
  return (
    <dl className={styles.root}>
      {items.map((item) => (
        <div key={item.term} className={styles.item}>
          <dt className={styles.term}>
            <span className={styles.no}>{item.no}</span>
            <span className={styles.headline}>{item.term}</span>
          </dt>
          <dd className={styles.description}>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
};
