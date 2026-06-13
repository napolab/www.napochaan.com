import { ImageResponse } from 'next/og';

import { findBlogBySlug } from '@lib/payload/blog';

import { dayjs } from '@utils/dayjs';
import { loadOgAssets } from '@utils/og/load-og-assets';
import { loadOgImage } from '@utils/og/load-og-image';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { requestOrigin } from '@utils/og/og-image-url';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

// Revalidate hourly — mirrors the blog detail page's ISR window.
export const revalidate = 3600;
export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ slug: string }> };

const FIELD_COLS = Math.ceil(SIZE.width / 56);
const FIELD_ROWS = Math.ceil(SIZE.height / 56);

const Image = async ({ params }: Params) => {
  const { slug } = await params;
  const post = await findBlogBySlug(slug);
  const origin = await requestOrigin();

  const formattedDate = post === undefined ? '' : dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD');
  const imageUrl = await loadOgImage(post?.thumbnail?.src, origin); // the post's thumbnail → image field; else GoL.
  const data = resolveOgCardData({
    section: 'blog',
    title: post?.title ?? 'blog',
    meta: `${formattedDate} · blog`,
    imageUrl,
  });

  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS); // fixed seed → consistent GoL texture across all cards
  const { fonts, wordmarkUrl } = await loadOgAssets();

  return new ImageResponse(<OgCard data={data} wordmarkUrl={wordmarkUrl} board={board} />, { ...size, fonts });
};

export default Image;
