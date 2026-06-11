import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
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
  items: readonly NewsItem[];
};

const isExternal = (href: string): boolean => href.startsWith('http://') || href.startsWith('https://');

const NewsTitle = ({ title, href }: { title: string; href?: string }) => {
  if (href === undefined) return <span className={styles.title}>{title}</span>;
  const external = isExternal(href);
  return (
    <Link href={href} tone="accent" className={styles.titleLink} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      <ScrambleText>{title}</ScrambleText>
      {external ? (
        <span className={styles.externalMark} aria-hidden="true">
          ↗
        </span>
      ) : null}
    </Link>
  );
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
          <li key={item.id} className={styles.item}>
            <span className={styles.date}>{item.date}</span>
            <span className={styles.category}>
              <Tag tone="outline">{item.category}</Tag>
            </span>
            <NewsTitle title={item.title} href={item.href} />
          </li>
        ))}
      </ol>
    </section>
  );
};
