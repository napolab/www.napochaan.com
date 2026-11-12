import { isPopulatedMedia } from '../is-populated-media';

import type { Media } from '@payload-types';

// The Payload SEO plugin injects this identical `meta` group into news/works/blog.
// Mirrors the generated wire shape (NULLs, unpopulated media as a numeric id).
type SeoMeta = {
  title?: string | null;
  description?: string | null;
  image?: (number | null) | Media;
};

// The consumed SEO shape: NULLs coerced to undefined, populated media reduced to
// its url string. Matches the `seo` field on the domain item types.
type DetailSeo = {
  title?: string;
  description?: string;
  image?: string;
};

// The url of a populated media image, or undefined for an unpopulated id / null url.
const imageURL = (image: SeoMeta['image']): string | undefined => {
  if (!isPopulatedMedia(image)) return undefined;
  if (image.url === null || image.url === undefined) return undefined;

  return image.url;
};

// Builds the domain `seo` field from a Payload `meta` group. Returns undefined
// when every resolved field is absent, so an empty object is never emitted. Pure.
export const toDetailSeo = (meta?: SeoMeta): DetailSeo | undefined => {
  const title = meta?.title ?? undefined;
  const description = meta?.description ?? undefined;
  const image = imageURL(meta?.image);

  if (title === undefined && description === undefined && image === undefined) return undefined;

  return { title, description, image };
};
