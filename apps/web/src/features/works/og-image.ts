import { findWorkBySlug } from '@lib/cms/works';
import { loadOgAssets } from '@utils/og/load-og-assets';
import { loadOgImage } from '@utils/og/load-og-image';
import { requestOrigin } from '@utils/og/og-image-url';
import { renderOgImage } from '@utils/og/render-og-image';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

// Port of `works/[slug]/opengraph-image.tsx`. An unknown slug still renders a card
// (title `works`, meta `<slug> · works`), as the Next route did — it never 404s.
export const renderWorkOgImage = async (slug: string): Promise<Response> => {
  const work = await findWorkBySlug(slug);
  const origin = await requestOrigin();
  // The work's thumbnail → the image column; else the Game-of-Life text card.
  const imageUrl = await loadOgImage(work?.thumbnail?.src, origin);
  const card = resolveOgCardData({ section: 'works', title: work?.title ?? 'works', meta: `${work?.no ?? slug} · ${work?.type ?? 'works'}`, imageUrl });

  return renderOgImage(card, await loadOgAssets());
};
