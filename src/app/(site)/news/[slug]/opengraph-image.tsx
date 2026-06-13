import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { isExternalNews } from '../_lib/is-external-news';

import { findNewsBySlug } from '@lib/payload/news';

import { dayjs } from '@utils/dayjs';
import { loadOgAssets } from '@utils/og/load-og-assets';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

// Revalidate hourly — mirrors the news detail page's ISR window.
export const revalidate = 3600;
export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ slug: string }> };

const FIELD_COLS = Math.ceil(SIZE.width / 56);
const FIELD_ROWS = Math.ceil(SIZE.height / 56);

const Image = async ({ params }: Params) => {
  const { slug } = await params;
  const item = await findNewsBySlug(slug);
  // Mirror the detail page: external-link items have no public surface, so their
  // OG card 404s too.
  if (item !== undefined && isExternalNews(item)) notFound();

  const formattedDate = item === undefined ? '' : dayjs(item.date).tz('Asia/Tokyo').format('YYYY.MM.DD');
  const data = resolveOgCardData({
    section: 'news',
    title: item?.title ?? 'news',
    meta: `${formattedDate} · og:image · 1200×630`,
    // news has no image source → always the GoL field.
  });

  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS); // fixed seed → consistent GoL texture across all cards
  const { fonts, wordmarkUrl } = await loadOgAssets();

  return new ImageResponse(<OgCard data={data} wordmarkUrl={wordmarkUrl} board={board} />, { ...size, fonts });
};

export default Image;
