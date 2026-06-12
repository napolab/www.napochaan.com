import { ImageResponse } from 'next/og';

import wordmark from '@assets/og/wordmark.png';

import { findNewsById } from '@lib/payload/news';

import { dayjs } from '@utils/dayjs';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { loadOgFonts } from '@utils/og/load-og-fonts';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

// Revalidate hourly — mirrors the news detail page's ISR window.
export const revalidate = 3600;
export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ id: string }> };

const FIELD_COLS = Math.ceil((SIZE.width - 432) / 24);
const FIELD_ROWS = Math.ceil(SIZE.height / 24);

const Image = async ({ params }: Params) => {
  const { id } = await params;
  const item = await findNewsById(id);
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  const formattedDate = item === undefined ? '' : dayjs(item.date).tz('Asia/Tokyo').format('YYYY.MM.DD');
  const data = resolveOgCardData({
    section: 'news',
    title: item?.title ?? 'news',
    meta: `${formattedDate} · og:image · 1200×630`,
    // news has no image source → always the GoL field.
  });

  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: id.length * 9973 + 17 });
  const fonts = await loadOgFonts(baseUrl);

  return new ImageResponse(<OgCard data={data} wordmarkUrl={`${baseUrl}${wordmark.src}`} board={board} />, { ...size, fonts });
};

export default Image;
