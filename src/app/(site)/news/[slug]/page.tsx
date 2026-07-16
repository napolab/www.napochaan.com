import { notFound } from 'next/navigation';

import { NewsDetail } from '../_components/news-detail';
import { adjacentNews } from '../_lib/adjacent-news';
import { isExternalNews } from '../_lib/is-external-news';

import { findNewsBySlug, findNewsList } from '@lib/payload/news';

import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages render on demand and are then cached;
// the collection's afterChange hook revalidates `/news/{slug}` on every edit.
// Draft Live Preview is served by the separate `/news/preview/{id}` route, so
// this page never touches draftMode and stays fully static.
export const revalidate = 3600;

// Build the news slugs on demand (build phase can't read Payload). `dynamicParams`
// lets any published slug be served + cached via on-demand ISR.
export const generateStaticParams = (): { slug: string }[] => [];
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

type Props = {
  params: Params;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const item = await findNewsBySlug(slug);
  // Match the page render: missing or external-link items have no detail page, so
  // 404 straight from metadata — no real metadata is generated for them.
  if (item === undefined || isExternalNews(item)) notFound();

  return resolveDetailMetadata({
    docTitle: item.title,
    path: `/news/${slug}`,
    seo: item.seo,
    body: item.body,
    genericDescription: 'お知らせ',
    defaultImage: '/og-default.png',
    markdown: `/news/${slug}.md`,
  });
};

const NewsDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  const item = await findNewsBySlug(slug);
  // An external-link news item exists in the CMS but is not meant to be read
  // on-site — its links point off to `item.url`, so the internal detail page 404s.
  if (item === undefined || isExternalNews(item)) notFound();

  const list = await findNewsList();
  const { prev, next } = adjacentNews(list, slug);

  return <NewsDetail item={item} prev={prev} next={next} />;
};

export default NewsDetailPage;
