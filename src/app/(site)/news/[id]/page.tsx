import { notFound } from 'next/navigation';

import { NewsDetail } from '../_components/news-detail';
import { adjacentNews } from '../_lib/adjacent-news';

import { findNewsById, findNewsList } from '@lib/payload/news';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages render on demand and are then cached;
// the collection's afterChange hook revalidates `/news/{id}` on every edit.
// Draft Live Preview is served by the separate `/news/preview/{id}` route, so
// this page never touches draftMode and stays fully static.
export const revalidate = 3600;

// Build the news ids on demand (build phase can't read Payload). `dynamicParams`
// lets any published id be served + cached via on-demand ISR.
export const generateStaticParams = (): { id: string }[] => [];
export const dynamicParams = true;

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

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

  return <NewsDetail item={item} prev={prev} next={next} />;
};

export default NewsDetailPage;
