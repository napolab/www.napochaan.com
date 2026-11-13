import { NewsRow } from '@components/news-row';
import { SectionHeading } from '@components/section-heading';

import * as styles from './styles.css';

type NewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  href?: string;
};

type Props = {
  items: readonly NewsItem[];
};

export const NewsSection = ({ items }: Props) => {
  return (
    <section className={styles.root}>
      <SectionHeading no="01" more="$ tail news" moreHref="/news">
        news
      </SectionHeading>
      {/* news = curated important notices; the home feed shows the top 5 (pinned first, then newest), full list at /news. */}
      <ol className={styles.log}>
        {items.slice(0, 5).map((item) => (
          <NewsRow key={item.id} date={item.date} category={item.category} title={item.title} href={item.href} />
        ))}
      </ol>
    </section>
  );
};
