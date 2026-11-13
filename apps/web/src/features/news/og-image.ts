import { findNewsBySlug } from '@lib/cms/news';
import { loadOgAssets } from '@utils/og/load-og-assets';
import { renderOgImage } from '@utils/og/render-og-image';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

import { formatNewsDate } from './lib/format-news-date';
import { isExternalNews } from './lib/is-external-news';

// Port of `news/[slug]/opengraph-image.tsx`. An external-link item has no public
// surface, so its card 404s like its detail page; an unknown slug still renders the
// generic card (title `news`). News has no image source → always the GoL text card.
export const renderNewsOgImage = async (slug: string): Promise<Response> => {
  const item = await findNewsBySlug(slug);
  if (item !== undefined && isExternalNews(item)) return new Response(null, { status: 404 });

  const formattedDate = item === undefined ? '' : formatNewsDate(item.date);
  const card = resolveOgCardData({ section: 'news', title: item?.title ?? 'news', meta: `${formattedDate} · og:image · 1200×630` });

  return renderOgImage(card, await loadOgAssets());
};
