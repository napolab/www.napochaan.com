import * as styles from './styles.css';

type Props = {
  rows: readonly { token: string; px: string; ratio: string; role: string }[];
};

// The type scale ladder. Each row renders a glyph specimen at the actual
// fontSize token (data-token → fontSize) so the jump between steps is visible,
// with the token name / px / ratio / role as the readable record.
export const TypeScale = ({ rows }: Props) => {
  return (
    <dl className={styles.root}>
      {rows.map((entry) => (
        <div key={entry.token} className={styles.row}>
          <dt className={styles.specimen} data-token={entry.token} aria-hidden="true">
            Ag
          </dt>
          <dd className={styles.meta}>
            <span className={styles.token}>{entry.token}</span>
            <span className={styles.figure}>{entry.px}</span>
            <span className={styles.figure}>{entry.ratio}</span>
            <span className={styles.role}>{entry.role}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
