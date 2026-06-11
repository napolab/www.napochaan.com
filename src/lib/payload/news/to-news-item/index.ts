import { dayjs } from '@utils/dayjs';

import { toDetailSeo } from '../../to-detail-seo';

import type { NewsItem } from '../../../../app/(site)/news/_lib/news-item';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { News } from '@payload-types';

// Maps a Payload `news` document to the site's domain `NewsItem`. Coerces
// Payload's NULL wire-format fields (url/body) to `undefined` at this boundary,
// so consumers only ever handle the absent-as-undefined case. Pure — no Payload
// client dependency, so it is unit-testable in isolation.
//
// `url` is absent when null OR empty string: Payload stores a cleared text field
// as '', and `??` alone would leak that '' downstream, breaking the `url ??
// /news/{id}` fallback (an empty href stops the title from linking).
export const toNewsItem = (doc: News): NewsItem => ({
  id: `${doc.id}`,
  date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  category: doc.category,
  title: doc.title,
  url: doc.url !== null && doc.url !== '' ? doc.url : undefined,
  body: (doc.body ?? undefined) as SerializedEditorState | undefined,
  seo: toDetailSeo(doc.meta),
});
