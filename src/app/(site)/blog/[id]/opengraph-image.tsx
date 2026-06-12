import { ImageResponse } from 'next/og';

import wordmark from '@assets/og/wordmark.png';

import { findBlogById } from '@lib/payload/blog';

import { dayjs } from '@utils/dayjs';
import { firstImageSrc } from '@utils/lexical/first-image-src';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { loadOgFonts } from '@utils/og/load-og-fonts';
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
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  const formattedDate = post === undefined ? '' : dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD');
  const data = resolveOgCardData({
    section: 'blog',
    title: post?.title ?? 'blog',
    meta: `${formattedDate} · blog`,
    imageUrl: firstImageSrc(post?.body) ?? undefined, // first body image → image field; else GoL.
  });

  const idNum = parseInt(id, 10);
  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: (Number.isNaN(idNum) ? 1 : idNum) * 9973 + 53 });
  const fonts = await loadOgFonts(baseUrl);

  return new ImageResponse(<OgCard data={data} wordmarkUrl={`${baseUrl}${wordmark.src}`} board={board} />, { ...size, fonts });
};

export default Image;
