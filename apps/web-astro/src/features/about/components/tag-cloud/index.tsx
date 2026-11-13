import * as styles from './styles.css';

type Props = {
  items: readonly string[];
};

// Outline code-chips: a dense love/skill inventory rendered as quiet mono tokens
// rather than solid accent pills, so ~40 entries stay legible and the electric
// blue is reserved for the hover lift (see styles.chip).
export const TagCloud = ({ items }: Props) => {
  return (
    <ul className={styles.root}>
      {items.map((item) => (
        <li key={item}>
          <span className={styles.chip}>{item}</span>
        </li>
      ))}
    </ul>
  );
};
