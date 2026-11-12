import { findGalleryList } from '@lib/payload/gallery';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { GalleryPhoto } from '@components/gallery-archive';
import type { ChannelData, ItemData } from '@utils/rss/types';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guard
// returns [], so a prerendered feed leaks localhost with no items. Resolving
// per-request reads the real host BASE_URL and published content at runtime; the
// findGalleryList() read stays cached via unstable_cache + revalidateTag('gallery').
export const dynamic = 'force-dynamic';

const absolutize = (src: string, origin: string): string => (src.startsWith('http') ? src : `${origin}${src}`);

// Best-effort MIME from the file extension; default to image/jpeg.
const mimeOf = (src: string): string => {
  if (src.endsWith('.png')) return 'image/png';
  if (src.endsWith('.webp')) return 'image/webp';
  if (src.endsWith('.gif')) return 'image/gif';

  return 'image/jpeg';
};

const toItem = (photo: GalleryPhoto, origin: string): ItemData => {
  const url = absolutize(photo.src, origin);

  return {
    title: photo.caption !== undefined && photo.caption !== '' ? photo.caption : photo.alt,
    link: `${origin}/gallery#${photo.id}`,
    guid: `${origin}/gallery#${photo.id}`,
    description: photo.alt,
    enclosure: { url, type: mimeOf(photo.src), length: 0 },
  };
};

export const GET = async (): Promise<Response> => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const photos = await findGalleryList();
  const items = photos.map((photo) => toItem(photo, origin));

  const channel = {
    title: 'napochaan — gallery',
    link: `${origin}/gallery`,
    description: 'napochaan のギャラリー — flyer・VRChat・photo。',
    language: 'ja',
    selfUrl: `${origin}/gallery/rss.xml`,
  } satisfies ChannelData;

  const xml = createRssDocument({ channel, items });

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
