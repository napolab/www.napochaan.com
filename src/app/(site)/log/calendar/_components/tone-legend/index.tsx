import * as styles from './styles.css';

// カレンダーのドットが何を意味するかの凡例。単体ページではカレンダーが主役に
// なるぶん、記号の意味を推測させない。ドットは Calendar のセルと同じ ::after
// トークンで描くので、data-tone の対応がそのまま見本になる。
export const ToneLegend = () => (
  <dl className={styles.root}>
    <div className={styles.item}>
      <dt className={styles.term}>
        <span className={styles.dot} data-tone="default" aria-hidden="true" />
      </dt>
      <dd className={styles.description}>記録</dd>
    </div>
    <div className={styles.item}>
      <dt className={styles.term}>
        <span className={styles.dot} data-tone="accent" aria-hidden="true" />
      </dt>
      <dd className={styles.description}>予定</dd>
    </div>
  </dl>
);
