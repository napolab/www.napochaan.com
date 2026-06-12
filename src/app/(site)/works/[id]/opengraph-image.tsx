import { ImageResponse } from 'next/og';

import { findWorkById } from '@lib/payload/works';

import { loadOgAssets } from '@utils/og/load-og-assets';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

// Revalidate hourly — mirrors the works detail page's ISR window.
export const revalidate = 3600;
export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ id: string }> };

const FIELD_COLS = Math.ceil((SIZE.width - 432) / 24);
const FIELD_ROWS = Math.ceil(SIZE.height / 24);

const Image = async ({ params }: Params) => {
  const { id } = await params;
  const work = await findWorkById(id);

  const data = resolveOgCardData({
    section: 'works',
    title: work?.title ?? 'works',
    meta: `no.${id} · ${work?.type ?? 'works'}`,
    imageUrl: work?.thumbnail?.src ?? undefined, // present → image field; absent → GoL.
  });

  const idNum = parseInt(id, 10);
  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: (Number.isNaN(idNum) ? 1 : idNum) * 9973 + 31 });
  const { fonts, wordmarkUrl } = await loadOgAssets();

  return new ImageResponse(<OgCard data={data} wordmarkUrl={wordmarkUrl} board={board} />, { ...size, fonts });
};

export default Image;
