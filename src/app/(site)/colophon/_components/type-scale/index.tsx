import * as styles from './styles.css';

type Props = {
  rows: readonly { token: string; px: string; ratio: string; role: string }[];
};

// The type scale ladder. Each row renders a glyph specimen at the actual
// fontSize token (data-token → fontSize) so the jump between steps is visible,
// with the token name as the term (dt) and px / ratio / role as its description
// (dd). The specimen is decorative (aria-hidden) and sits outside the dt/dd pair
// so the term→description relationship stays semantically intact.
export const TypeScale = ({ rows }: Props) => {
  return (
    <dl className={styles.root}>
      {rows.map((entry) => (
        <div key={entry.token} className={styles.row}>
          <div className={styles.specimen} data-token={entry.token} aria-hidden="true">
            Ag
          </div>
          <dt className={styles.token}>{entry.token}</dt>
          <dd className={styles.meta}>
            <span className={styles.figure}>{entry.px}</span>
            <span className={styles.figure}>{entry.ratio}</span>
            <span className={styles.role}>{entry.role}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
