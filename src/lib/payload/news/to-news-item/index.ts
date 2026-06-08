import { dayjs } from '@utils/dayjs';

import type { NewsItem } from '../../../../app/(site)/news/_lib/news-item';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { News } from '@payload-types';

// Maps a Payload `news` document to the site's domain `NewsItem`. Coerces
// Payload's NULL wire-format fields (url/body) to `undefined` at this boundary,
// so consumers only ever handle the absent-as-undefined case. Pure — no Payload
// client dependency, so it is unit-testable in isolation.
export const toNewsItem = (doc: News): NewsItem => ({
  id: `${doc.id}`,
  date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  category: doc.category,
  title: doc.title,
  url: doc.url ?? undefined,
  body: (doc.body ?? undefined) as SerializedEditorState | undefined,
});
