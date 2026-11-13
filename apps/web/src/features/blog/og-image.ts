import { findBlogBySlug } from '@lib/cms/blog';
import { loadOgAssets } from '@utils/og/load-og-assets';
import { loadOgImage } from '@utils/og/load-og-image';
import { requestOrigin } from '@utils/og/og-image-url';
import { renderOgImage } from '@utils/og/render-og-image';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

import { formatPostDate } from './lib/format-post-date';

// Port of `blog/[slug]/opengraph-image.tsx`. An unknown slug still renders a card
// (title `blog`, no image), as the Next route did — it never 404s.
export const renderBlogOgImage = async (slug: string): Promise<Response> => {
  const post = await findBlogBySlug(slug);
  const origin = await requestOrigin();
  const formattedDate = post === undefined ? '' : formatPostDate(post.date);
  // The post's thumbnail → the image column; else the Game-of-Life text card.
  const imageUrl = await loadOgImage(post?.thumbnail?.src, origin);
  const card = resolveOgCardData({ section: 'blog', title: post?.title ?? 'blog', meta: `${formattedDate} · blog`, imageUrl });

  return renderOgImage(card, await loadOgAssets());
};
