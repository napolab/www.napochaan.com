import { NewsRow } from '@components/news-row';

import { NoAction } from './no-action';

import * as styles from './news-row-demo.css';

// Three rows covering every state the shared NewsRow takes: an internal link, an
// external link (new tab + ↗ marker), and a plain non-link title. Wrapped in
// <NoAction> so the realistic hrefs never navigate from the colophon.
export const NewsRowDemo = () => (
  <NoAction>
    <ol className={styles.list}>
      <NewsRow date="06.14" category="event" title="Booth² vol.03 を開催します" href="/news/1" />
      <NewsRow date="05.30" category="release" title="新しいミックスを公開しました" href="https://example.com" />
      <NewsRow date="05.02" category="info" title="サイトをリニューアルしました" />
    </ol>
  </NoAction>
);
