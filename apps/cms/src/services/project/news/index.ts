import { dayjs } from '@utils/dayjs';

import { toDetailSeo } from '../to-detail-seo';
import { toLexicalJSON } from '../to-lexical-json';

import type { NewsItemDTO } from '@napochaan/cms-api/services';
import type { News } from '@payload-types';

// Payload stores a cleared text field as '' (not null). Treat it as absent so
// consumers fall back to the internal /news/{slug} detail link.
const toURL = (url: string | null | undefined): string | undefined => {
  if (url === null || url === undefined || url === '') return undefined;

  return url;
};

// Maps a Payload `news` document to `NewsItemDTO`. Absent optional fields are left
// out of the object entirely. Pure.
export const projectNewsItem = (doc: News): NewsItemDTO => {
  const url = toURL(doc.url);
  const bodyJSON = toLexicalJSON(doc.body);
  const seo = toDetailSeo(doc.meta);

  return {
    id: `${doc.id}`,
    slug: doc.slug,
    date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
    category: doc.category,
    title: doc.title,
    ...(url !== undefined && { url }),
    ...(bodyJSON !== undefined && { bodyJSON }),
    ...(seo !== undefined && { seo }),
  };
};
