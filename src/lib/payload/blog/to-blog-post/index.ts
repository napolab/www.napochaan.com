import { extractPlainText } from '@utils/lexical/extract-plain-text';
import { dayjs } from '@utils/dayjs';
import { readingMinutes } from '@utils/reading-minutes';

import { toDetailSeo } from '../../to-detail-seo';

import type { Post } from '../../../../app/(site)/blog/_lib/post';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Blog } from '@payload-types';

// Maps a Payload `blog` document to the site's `Post`. `index` is the caller's
// display ordinal. `readMin` is derived from the body text (never stored), so it
// always matches the content. Pure.
export const toBlogPost = (doc: Blog, index: string): Post => {
  const body = (doc.body ?? undefined) as SerializedEditorState | undefined;

  return {
    id: `${doc.id}`,
    index,
    title: doc.title,
    date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
    excerpt: doc.excerpt,
    readMin: readingMinutes(extractPlainText(body)),
    body,
    seo: toDetailSeo(doc.meta),
  };
};
