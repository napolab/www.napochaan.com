import { createRssDocument } from '@utils/rss/create-rss-document';

import type { GalleryPhoto } from '@components/gallery-archive';
import type { ChannelData, ItemData } from '@utils/rss/types';

const absolutize = (src: string, origin: string): string => (src.startsWith('http') ? src : `${origin}${src}`);

// Best-effort MIME from the file extension; default to image/jpeg.
const mimeOf = (src: string): string => {
  if (src.endsWith('.png')) return 'image/png';
  if (src.endsWith('.webp')) return 'image/webp';
  if (src.endsWith('.gif')) return 'image/gif';

  return 'image/jpeg';
};

const toItem = (photo: GalleryPhoto, origin: string): ItemData => ({
  title: photo.caption !== undefined && photo.caption !== '' ? photo.caption : photo.alt,
  link: `${origin}/gallery#${photo.id}`,
  guid: `${origin}/gallery#${photo.id}`,
  description: photo.alt,
  enclosure: { url: absolutize(photo.src, origin), type: mimeOf(photo.src), length: 0 },
});

// Port of `gallery/rss.xml/route.ts`: published photos as RSS 2.0 (`/gallery/rss.xml`),
// one item per photo with the image as its enclosure. Pure.
export const buildGalleryRSS = (photos: readonly GalleryPhoto[], origin: string): string => {
  const channel = {
    title: 'napochaan — gallery',
    link: `${origin}/gallery`,
    description: 'napochaan のギャラリー — flyer・VRChat・photo。',
    language: 'ja',
    selfUrl: `${origin}/gallery/rss.xml`,
  } satisfies ChannelData;

  return createRssDocument({ channel, items: photos.map((photo) => toItem(photo, origin)) });
};
