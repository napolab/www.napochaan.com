import Link from 'next/link';
import { getPayload } from 'payload';

import { dayjs } from '@utils/dayjs';

import config from '@payload-config';

import type { News } from '@payload-types';

// Japanese label for each news category. Mirrors the `category` select options
// in src/collections/news.ts (value → label). Typed with `satisfies Record<
// News['category'], string>` so adding a new category to the collection without
// labelling it here is a compile error.
const CATEGORY_LABELS = {
  notification: 'お知らせ',
  support: 'サポート',
  talk: '登壇',
  dj: 'DJ',
  vj: 'VJ',
  work: '制作',
  flyer: 'フライヤー',
} satisfies Record<News['category'], string>;

// Rendered above the news list table (admin.components.beforeListTable). It runs
// its OWN `pinned: true` query — independent of the table's paginated list query —
// so every pinned item stays visible on the admin list no matter which page or
// filter the table is showing. Sorted newest-first to match the public feed.
export const NewsPinnedStrip = async () => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'news',
    where: { pinned: { equals: true } },
    sort: '-publishedAt',
    depth: 0,
    limit: 100,
  });

  if (docs.length === 0) return null;

  return (
    <section className="news-pinned-strip">
      <strong className="news-pinned-strip__heading">📌 ピン留め中（{docs.length}）</strong>
      <ul className="news-pinned-strip__list">
        {docs.map((doc) => (
          <li key={doc.id} className="news-pinned-strip__item">
            <Link className="news-pinned-strip__title" href={`/admin/collections/news/${doc.id}`}>
              {doc.title}
            </Link>
            <span className="news-pinned-strip__meta">
              {CATEGORY_LABELS[doc.category]} · {dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
