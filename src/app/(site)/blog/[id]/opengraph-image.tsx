import { ImageResponse } from 'next/og';

import { findBlogById } from '@lib/payload/blog';

import { dayjs } from '@utils/dayjs';
import { firstImageSrc } from '@utils/lexical/first-image-src';
import { loadOgAssets } from '@utils/og/load-og-assets';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { absoluteMediaUrl, requestOrigin } from '@utils/og/og-image-url';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

// Revalidate hourly — mirrors the blog detail page's ISR window.
export const revalidate = 3600;
export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ id: string }> };

const FIELD_COLS = Math.ceil((SIZE.width - 432) / 24);
const FIELD_ROWS = Math.ceil(SIZE.height / 24);

const Image = async ({ params }: Params) => {
  const { id } = await params;
  const post = await findBlogById(id);
  const origin = await requestOrigin();

  const formattedDate = post === undefined ? '' : dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD');
  const data = resolveOgCardData({
    section: 'blog',
    title: post?.title ?? 'blog',
    meta: `${formattedDate} · blog`,
    imageUrl: absoluteMediaUrl(firstImageSrc(post?.body), origin), // first body image → image field; else GoL.
  });

  const idNum = parseInt(id, 10);
  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: (Number.isNaN(idNum) ? 1 : idNum) * 9973 + 53 });
  const { fonts, wordmarkUrl } = await loadOgAssets();

  return new ImageResponse(<OgCard data={data} wordmarkUrl={wordmarkUrl} board={board} />, { ...size, fonts });
};

export default Image;
