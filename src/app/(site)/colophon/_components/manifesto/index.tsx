import * as styles from './styles.css';

type Props = {
  items: readonly { term: string; description: string }[];
};

// A manifesto: a list of principles, each a bold headline (dt) followed by its
// elaboration (dd). A <dl> keeps "principle → explanation" semantic without
// adding heading elements under the section's h2.
export const Manifesto = ({ items }: Props) => {
  return (
    <dl className={styles.root}>
      {items.map((item) => (
        <div key={item.term} className={styles.item}>
          <dt className={styles.term}>{item.term}</dt>
          <dd className={styles.description}>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
};
