import { AboutWhoami } from './_components/about-whoami';
import { BlogIndex } from './_components/blog-index';
import { GallerySection } from './_components/gallery-section';
import { LogSection } from './_components/log-section';
import { Hero } from './_components/hero';
import { NewsSection } from './_components/news-section';
import { WorksSection } from './_components/works-section';
import { buildLogTimeline } from './log/_lib/build-log-timeline';
import { fetchExternalPosts } from './log/_lib/fetch-external-posts';
import { findBlogList } from '@lib/payload/blog';
import { findGalleryList } from '@lib/payload/gallery';
import { findLatestNews, findNewsList } from '@lib/payload/news';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';
import * as s from './styles.css';

import type { NewsItem } from './news/_lib/news-item';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

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
  href: item.url ?? `/news/${item.id}`,
});

const toFeedItems = (items: readonly NewsItem[]): readonly NewsFeedItem[] => items.map(toFeedItem);

// Sample data — replaced by Payload CMS in a later plan.
const about = {
  skills: ['TypeScript', 'React', 'Hono', 'Cloudflare', 'WebGPU'],
  now: 'DJ / VJ / グラフィック制作',
  likes: '音楽 · glitch · VRChat · コラージュ · 崩壊(pixelsort・datamosh)',
  wants: '後悔を、残さない。ぼくも、周りも。',
};

// Number of latest log entries shown in the home teaser.
const HOME_LOG_LIMIT = 5;

const HomePage = async () => {
  const [latest, allNews, works, blogPosts, galleryPhotos, logs, externalPosts] = await Promise.all([
    findLatestNews(3),
    findNewsList(),
    findWorksList(),
    findBlogList(),
    findGalleryList(),
    findLogList(),
    fetchExternalPosts(),
  ]);

  const newsItems = toFeedItems(latest);
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  // Build the full timeline from all news/works/posts; take the N newest entries for the home teaser.
  const logGroups = buildLogTimeline(allNews, works, externalPosts, now, logs);
  const logEntries = logGroups.flatMap((group) => group.items).slice(0, HOME_LOG_LIMIT);
  const homePosts = [...blogPosts].slice(0, 3);
  const homeWorks = [...works].slice(0, 3);

  return (
    <main id="main-content" className={s.main}>
      <h1 className={s.srOnly}>napochaan — DJ・VJ・グラフィック・デジタル</h1>
      <Hero />
      <AboutWhoami id="about" {...about} />
      <NewsSection items={newsItems} />
      <WorksSection id="works" works={homeWorks} />
      <LogSection id="log" entries={logEntries} />
      <GallerySection id="gallery" photos={galleryPhotos} />
      <BlogIndex id="blog" posts={homePosts} />
    </main>
  );
};

export default HomePage;
