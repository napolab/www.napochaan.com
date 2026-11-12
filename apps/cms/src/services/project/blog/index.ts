import { extractPlainText } from '@utils/lexical/extract-plain-text';
import { dayjs } from '@utils/dayjs';
import { readingMinutes } from '@utils/reading-minutes';

import { toDetailSeo } from '../to-detail-seo';
import { toLexicalJSON } from '../to-lexical-json';
import { toMediaRef } from '../to-media-ref';

import type { PostDTO } from '@napochaan/cms-api/services';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Blog } from '@payload-types';

// Maps a Payload `blog` document to `PostDTO`. `index` is the caller's display
// ordinal. `readMin` is derived from the body text (never stored). Absent optional
// fields are left out of the object entirely (no `key: undefined`). Pure.
export const projectPost = (doc: Blog, index: string): PostDTO => {
  const body = (doc.body ?? undefined) as SerializedEditorState | undefined;
  const thumbnail = toMediaRef(doc.thumbnail);
  const bodyJSON = toLexicalJSON(body);
  const seo = toDetailSeo(doc.meta);

  return {
    id: `${doc.id}`,
    slug: doc.slug,
    index,
    title: doc.title,
    date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
    excerpt: doc.excerpt,
    readMin: readingMinutes(extractPlainText(body)),
    ...(thumbnail !== undefined && { thumbnail }),
    ...(bodyJSON !== undefined && { bodyJSON }),
    ...(seo !== undefined && { seo }),
  };
};
