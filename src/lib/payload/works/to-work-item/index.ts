import { dayjs } from '@utils/dayjs';

import { isPopulatedMedia } from '../../is-populated-media';
import { toDetailSeo } from '../../to-detail-seo';

import type { WorkRow } from '../../../../app/(site)/works/_lib/work-row';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Work } from '@payload-types';

const toThumbnail = (thumbnail: Work['thumbnail']): WorkRow['thumbnail'] => {
  if (!isPopulatedMedia(thumbnail)) return undefined;
  if (thumbnail.url === null || thumbnail.url === undefined) return undefined;
  if (thumbnail.width === null || thumbnail.width === undefined) return undefined;
  if (thumbnail.height === null || thumbnail.height === undefined) return undefined;

  return { src: thumbnail.url, width: thumbnail.width, height: thumbnail.height };
};

// Maps a Payload `works` document to the site's `WorkRow`. `no` is the display
// ordinal, supplied entirely by the caller from list order (the CMS no longer
// stores a `no` field). Payload NULLs are coerced to undefined at this boundary.
// Pure — unit-testable in isolation.
export const toWorkItem = (doc: Work, no: string): WorkRow => {
  const at = dayjs(doc.date).tz('Asia/Tokyo');

  return {
    id: `${doc.id}`,
    no,
    title: doc.title,
    type: doc.type,
    year: at.year(),
    date: at.format('YYYY-MM-DD'),
    url: doc.url ?? undefined,
    thumbnail: toThumbnail(doc.thumbnail),
    description: doc.description ?? undefined,
    body: (doc.body ?? undefined) as SerializedEditorState | undefined,
    seo: toDetailSeo(doc.meta),
  };
};
