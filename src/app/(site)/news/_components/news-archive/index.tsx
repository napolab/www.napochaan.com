import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { Tag } from '@components/tag';
import { dayjs } from '@utils/dayjs';

import * as s from './styles.css';

// Narrow local row shape — the component only reads these fields, so it declares
// its own type rather than importing the wider NewsItem (which carries the rich
// text body the archive never touches).
type ArchiveItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  // Optional external destination. When set, the row links here instead of the
  // internal `/news/{id}` detail page. Absolute http(s) URLs open in a new tab.
  url?: string;
};

type ArchiveGroup = {
  key: string;
  label: string;
  items: readonly ArchiveItem[];
};

type Props = {
  groups: readonly ArchiveGroup[];
};

const isExternal = (href: string): boolean => href.startsWith('http://') || href.startsWith('https://');

const NewsRow = ({ item }: { item: ArchiveItem }) => {
  const href = item.url ?? `/news/${item.id}`;
  const external = isExternal(href);

  return (
    <li className={s.row}>
      <span className={s.date}>{dayjs(item.date).tz('Asia/Tokyo').format('MM.DD')}</span>
      <Tag tone="outline" className={s.category}>
        {item.category}
      </Tag>
      <Link href={href} tone="accent" className={s.title} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        <ScrambleText>{item.title}</ScrambleText>
        {external ? (
          <span className={s.externalMark} aria-hidden="true">
            ↗
          </span>
        ) : null}
      </Link>
    </li>
  );
};

// The full announcement archive grouped by year-month, newest first. A Server
// Component — the title links are plain anchors; the only client island is the
// ScrambleText that decodes the title on hover.
export const NewsArchive = ({ groups }: Props) => {
  return (
    <div className={s.root}>
      {groups.map((group) => (
        <section key={group.key} className={s.group} aria-labelledby={`news-${group.key}`}>
          <h2 id={`news-${group.key}`} className={s.month}>
            {group.label}
          </h2>
          <ol className={s.rows}>
            {group.items.map((item) => (
              <NewsRow key={item.id} item={item} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
};
