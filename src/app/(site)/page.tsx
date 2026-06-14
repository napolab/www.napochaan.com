import { AboutWhoami } from './_components/about-whoami';
import { BlogIndex } from './_components/blog-index';
import { GallerySection } from './_components/gallery-section';
import { LogSection } from './_components/log-section';
import { Hero } from './_components/hero';
import { NewsSection } from './_components/news-section';
import { WorksSection } from './_components/works-section';
import { selectHomeLogTeaser } from './_lib/select-home-log-teaser';
import { buildLogTimeline } from './log/_lib/build-log-timeline';
import { fetchExternalPosts } from './log/_lib/fetch-external-posts';
import { findBlogList } from '@lib/payload/blog';
import { findGalleryList } from '@lib/payload/gallery';
import { findLatestNews } from '@lib/payload/news';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';
import * as s from './styles.css';

import type { NewsItem } from './news/_lib/news-item';
import type { Metadata } from 'next';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

const homeDescription = 'DJ・VJ・グラフィック・デジタル制作。napochaan の個人サイト。';

// The OG/Twitter cards are spelled out in full (not just title/description) so the
// child metadata doesn't replace the root layout's card with a partial object: a
// `twitter` without `card` falls back to the small `summary` card, and an
// `openGraph` without `type`/`siteName`/`locale` drops those. The image itself comes
// from the file-convention opengraph-image.png / twitter-image.png under (site).
export const generateMetadata = (): Metadata => ({
  description: homeDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'napochaan',
    locale: 'ja_JP',
    url: '/',
    title: 'napochaan',
    description: homeDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'napochaan',
    description: homeDescription,
  },
});

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

// Sample data — replaced by Payload CMS in a later plan.
const about = {
  skills: ['TypeScript', 'React', 'Hono', 'Cloudflare', 'WebGPU'],
  now: 'DJ / VJ / グラフィック制作',
  likes: '音楽 · glitch · VRChat · コラージュ · 崩壊(pixelsort・datamosh)',
  wants: '後悔を、残さない。ぼくも、周りも。',
};

// Number of log entries shown in the home teaser (upcoming-first, then recent).
const HOME_LOG_LIMIT = 5;

const HomePage = async () => {
  const [latest, works, blogPosts, galleryPhotos, logs, externalPosts] = await Promise.all([
    findLatestNews(5),
    findWorksList(),
    findBlogList(),
    findGalleryList(),
    findLogList(),
    fetchExternalPosts(),
  ]);

  const newsItems = toFeedItems(latest);
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  // Build the full timeline from works/posts/logs; the home teaser leads with the
  // soonest upcoming gigs and backfills with the most recent finished entries.
  const logGroups = buildLogTimeline(works, externalPosts, now, logs);
  const logEntries = selectHomeLogTeaser(
    logGroups.flatMap((group) => group.items),
    HOME_LOG_LIMIT,
  );
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
