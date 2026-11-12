import { extractPlainText } from '@utils/lexical/extract-plain-text';
import { dayjs } from '@utils/dayjs';
import { readingMinutes } from '@utils/reading-minutes';

import { isPopulatedMedia } from '../../is-populated-media';
import { toDetailSeo } from '../../to-detail-seo';

import type { Post } from '../../../../app/(site)/blog/_lib/post';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Blog } from '@payload-types';

// Coerce the wire thumbnail (NULL / unpopulated id / populated Media) to the
// site shape, dropping it unless every dimension is present. Mirrors works.
const toThumbnail = (thumbnail: Blog['thumbnail']): Post['thumbnail'] => {
  if (!isPopulatedMedia(thumbnail)) return undefined;
  if (thumbnail.url === null || thumbnail.url === undefined) return undefined;
  if (thumbnail.width === null || thumbnail.width === undefined) return undefined;
  if (thumbnail.height === null || thumbnail.height === undefined) return undefined;

  return { src: thumbnail.url, width: thumbnail.width, height: thumbnail.height };
};

// Maps a Payload `blog` document to the site's `Post`. `index` is the caller's
// display ordinal. `readMin` is derived from the body text (never stored), so it
// always matches the content. Pure.
export const toBlogPost = (doc: Blog, index: string): Post => {
  const body = (doc.body ?? undefined) as SerializedEditorState | undefined;

  return {
    id: `${doc.id}`,
    slug: doc.slug,
    index,
    title: doc.title,
    date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
    excerpt: doc.excerpt,
    readMin: readingMinutes(extractPlainText(body)),
    thumbnail: toThumbnail(doc.thumbnail),
    body,
    seo: toDetailSeo(doc.meta),
  };
};
