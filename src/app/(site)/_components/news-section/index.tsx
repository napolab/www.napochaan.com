import { Link } from '@components/link';
import { SectionHeading } from '@components/section-heading';
import { Tag } from '@components/tag';

import * as styles from './styles.css';

type NewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  href?: string;
};

type Props = {
  items: NewsItem[];
};

const NewsTitle = ({ title, href }: { title: string; href?: string }) => {
  if (href === undefined) return <span className={styles.title}>{title}</span>;
  return (
    <Link href={href} className={styles.title}>
      {title}
    </Link>
  );
};

export const NewsSection = ({ items }: Props) => {
  return (
    <section className={styles.root}>
      <SectionHeading no="01" more="お知らせ →" moreHref="/news">
        news
      </SectionHeading>
      <ol className={styles.log}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.date}>{item.date}</span>
            <Tag tone="outline">{item.category}</Tag>
            <NewsTitle title={item.title} href={item.href} />
          </li>
        ))}
      </ol>
    </section>
  );
};
