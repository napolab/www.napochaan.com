import { NewsSection } from '../../../_components/news-section';
import { findLatestNews } from '@lib/payload/news';

import type { NewsItem } from '../../../news/_lib/news-item';

type NewsFeedItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  href: string;
};

// External url when set, otherwise the internal detail page. Named module-scope
// helpers keep the mapping out of JSX (react-perf/jsx-no-new-array-as-prop).
const toFeedItem = (item: NewsItem): NewsFeedItem => ({
  id: item.id,
  date: item.date,
  category: item.category,
  title: item.title,
  href: item.url ?? `/news/${item.slug}`,
});

const toFeedItems = (items: readonly NewsItem[]): readonly NewsFeedItem[] => items.map(toFeedItem);

export const NewsSectionLoader = async () => {
  const latest = await findLatestNews(5);

  return <NewsSection items={toFeedItems(latest)} />;
};
