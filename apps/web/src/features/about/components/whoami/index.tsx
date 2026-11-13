import * as styles from './styles.css';

type Item = {
  term: string;
  description: string;
};

type Props = {
  items: readonly Item[];
};

export const Whoami = ({ items }: Props) => {
  return (
    <dl className={styles.root}>
      {items.map((item) => (
        <div key={item.term} className={styles.row}>
          <dt className={styles.term}>{item.term}</dt>
          <dd className={styles.description}>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
};
