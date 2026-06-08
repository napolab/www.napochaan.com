import { notFound } from 'next/navigation';

import { NewsNav } from './_components/news-nav';
import { adjacentNews } from '../_lib/adjacent-news';
import * as s from './styles.css';

import { LivePreviewListener } from '@components/live-preview';
import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { findNewsById, findNewsList } from '@lib/payload/news';
import { dayjs } from '@utils/dayjs';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages render on demand and are then cached;
// the collection's afterChange hook revalidates `/news/{id}` on every edit.
export const revalidate = 3600;

// Build the news ids on demand (build phase can't read Payload). `dynamicParams`
// lets any published id be served + cached via on-demand ISR.
export const generateStaticParams = (): { id: string }[] => [];
export const dynamicParams = true;

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/news', label: 'news' }, { label: title }];

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const item = await findNewsById(id);

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
  const item = await findNewsById(id);
  if (item === undefined) notFound();

  const list = await findNewsList();
  const { prev, next } = adjacentNews(list, id);
  const crumbs = buildCrumbs(item.title);

  return (
    <main id="main-content" className={s.main}>
      <LivePreviewListener />
      <PageHeader title={item.title} breadcrumbs={crumbs} kicker={`// ${dayjs(item.date).tz('Asia/Tokyo').format('YYYY.MM.DD')} · ${item.category}`} titleTracking="tight" />
      <div className={s.body}>{item.body === undefined ? null : <RichText data={item.body} />}</div>
      <NewsNav prev={prev} next={next} />
    </main>
  );
};

export default NewsDetailPage;
