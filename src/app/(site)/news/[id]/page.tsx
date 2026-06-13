import { notFound } from 'next/navigation';

import { NewsDetail } from '../_components/news-detail';
import { adjacentNews } from '../_lib/adjacent-news';
import { isExternalNews } from '../_lib/is-external-news';

import { findNewsById, findNewsList } from '@lib/payload/news';

import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

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
  // Match the page render: missing or external-link items have no detail page, so
  // 404 straight from metadata — no real metadata is generated for them.
  if (item === undefined || isExternalNews(item)) notFound();

  return resolveDetailMetadata({
    docTitle: item.title,
    path: `/news/${id}`,
    seo: item.seo,
    body: item.body,
    genericDescription: 'お知らせ',
    defaultImage: '/og-default.png',
  });
};

const NewsDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const item = await findNewsById(id);
  // An external-link news item exists in the CMS but is not meant to be read
  // on-site — its links point off to `item.url`, so the internal detail page 404s.
  if (item === undefined || isExternalNews(item)) notFound();

  const list = await findNewsList();
  const { prev, next } = adjacentNews(list, id);

  return <NewsDetail item={item} prev={prev} next={next} />;
};

export default NewsDetailPage;
