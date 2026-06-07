import { notFound } from 'next/navigation';

import { NewsNav } from './_components/news-nav';
import { adjacentNews } from '../_lib/adjacent-news';
import { findNews } from '../_lib/find-news';
import { news } from '../sample-news';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { dayjs } from '@utils/dayjs';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages are static (no searchParams), so this
// drives the static cache for the pre-rendered sample ids.
export const revalidate = 3600;

// Pre-render every sample news id at build time. Replaced by a CMS query in a
// later plan, but the shape stays the same.
export const generateStaticParams = () => news.map((item) => ({ id: item.id }));

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/news', label: 'news' }, { label: title }];

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const item = findNews(news, id);

  return {
    get title() {
      if (item === undefined) return 'news';
      return item.title;
    },
    get description() {
      if (item === undefined) return 'お知らせ';
      return item.title;
    },
  };
};

const NewsDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const item = findNews(news, id);
  if (item === undefined) notFound();

  const { prev, next } = adjacentNews(news, id);
  const crumbs = buildCrumbs(item.title);

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title={item.title} breadcrumbs={crumbs} kicker={`// ${dayjs(item.date).tz('Asia/Tokyo').format('YYYY.MM.DD')} · ${item.category}`} titleTracking="tight" />
      <div className={s.body}>{item.body === undefined ? null : <RichText data={item.body} />}</div>
      <NewsNav prev={prev} next={next} />
    </main>
  );
};

export default NewsDetailPage;
