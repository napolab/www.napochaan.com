import { dayjs } from '@utils/dayjs';

import type { WorkRow } from '../../../../app/(site)/works/_lib/work-row';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Media, Work } from '@payload-types';

// A populated media upload (depth >= 1) is an object with url/width/height; an
// unpopulated one is just the numeric id. Narrow to the object case.
const isPopulatedMedia = (value: unknown): value is Media => typeof value === 'object' && value !== null && 'url' in value;

const toThumbnail = (thumbnail: Work['thumbnail']): WorkRow['thumbnail'] => {
  if (!isPopulatedMedia(thumbnail)) return undefined;
  if (thumbnail.url === null || thumbnail.url === undefined) return undefined;
  if (thumbnail.width === null || thumbnail.width === undefined) return undefined;
  if (thumbnail.height === null || thumbnail.height === undefined) return undefined;

  return { src: thumbnail.url, width: thumbnail.width, height: thumbnail.height };
};

// Maps a Payload `works` document to the site's `WorkRow`. `no` is supplied by the
// caller (derived from list order) since it is optional in the CMS. Payload NULLs
// are coerced to undefined at this boundary. Pure — unit-testable in isolation.
export const toWorkItem = (doc: Work, no: string): WorkRow => {
  const at = dayjs(doc.date).tz('Asia/Tokyo');

  return {
    id: `${doc.id}`,
    no: doc.no ?? no,
    title: doc.title,
    type: doc.type,
    year: at.year(),
    date: at.format('YYYY-MM-DD'),
    url: doc.url ?? undefined,
    thumbnail: toThumbnail(doc.thumbnail),
    description: doc.description ?? undefined,
    body: (doc.body ?? undefined) as SerializedEditorState | undefined,
  };
};
