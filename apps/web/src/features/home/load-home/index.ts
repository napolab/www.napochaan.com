import { findBlogList } from '@lib/cms/blog';
import { findGalleryList } from '@lib/cms/gallery';
import { findLogList } from '@lib/cms/logs';
import { findLatestNews } from '@lib/cms/news';
import { findWorksList } from '@lib/cms/works';
import { dayjs } from '@utils/dayjs';

import { buildLogTimeline } from '../../log/lib/build-log-timeline';
import { fetchExternalPosts } from '../../log/lib/fetch-external-posts';
import { selectHomeLogTeaser } from '../lib/select-home-log-teaser';

import type { NewsItem } from '../../news/news-item';

// Ports of the Next home `_sections/*` loaders. Each returns the serializable props
// its section island takes; `src/pages/index.astro` awaits them in parallel.

// Number of log entries shown in the home teaser (upcoming-first, then recent).
const HOME_LOG_LIMIT = 5;
// Number of works / blog posts shown in the home teasers.
const HOME_TEASER_LIMIT = 3;

type NewsFeedItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  href: string;
};

// External url when set, otherwise the internal detail page.
const toFeedItem = (item: NewsItem): NewsFeedItem => ({
  id: item.id,
  date: item.date,
  category: item.category,
  title: item.title,
  href: item.url ?? `/news/${item.slug}`,
});

export const loadHomeNews = async () => {
  const latest = await findLatestNews(5);

  return latest.map(toFeedItem);
};

export const loadHomeWorks = async () => {
  const works = await findWorksList();

  return works.slice(0, HOME_TEASER_LIMIT);
};

export const loadHomeLogEntries = async () => {
  const [works, externalPosts, logs] = await Promise.all([findWorksList(), fetchExternalPosts(), findLogList()]);

  const now = dayjs().tz('Asia/Tokyo').toISOString();
  // Build the full timeline from works/posts/logs; the home teaser leads with the
  // soonest upcoming gigs and backfills with the most recent finished entries.
  const logGroups = buildLogTimeline(works, externalPosts, now, logs);

  return selectHomeLogTeaser(
    logGroups.flatMap((group) => group.items),
    HOME_LOG_LIMIT,
  ).toReversed();
};

export const loadHomeGallery = async () => findGalleryList();

export const loadHomePosts = async () => {
  const posts = await findBlogList();

  return posts.slice(0, HOME_TEASER_LIMIT);
};

// Every home section's data, fetched in parallel.
export const loadHome = async () => {
  const [news, works, logEntries, photos, posts] = await Promise.all([loadHomeNews(), loadHomeWorks(), loadHomeLogEntries(), loadHomeGallery(), loadHomePosts()]);

  return { news, works, logEntries, photos, posts };
};
