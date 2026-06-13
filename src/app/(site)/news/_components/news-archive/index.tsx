import { NewsRow } from '@components/news-row';
import { dayjs } from '@utils/dayjs';

import * as s from './styles.css';

// Narrow local row shape — the component only reads these fields, so it declares
// its own type rather than importing the wider NewsItem (which carries the rich
// text body the archive never touches).
type ArchiveItem = {
  id: string;
  slug: string;
  date: string;
  category: string;
  title: string;
  // Optional external destination. When set, the row links here instead of the
  // internal `/news/{slug}` detail page. Absolute http(s) URLs open in a new tab.
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

// The full announcement archive grouped by year-month, newest first. A Server
// Component — each row's title link is the only client island (a ScrambleText
// that decodes on hover). The row layout itself lives in the shared NewsRow.
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
              <NewsRow key={item.id} date={dayjs(item.date).tz('Asia/Tokyo').format('MM.DD')} category={item.category} title={item.title} href={item.url ?? `/news/${item.slug}`} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
};
