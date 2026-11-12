import { dayjs } from '@utils/dayjs';

import { toDetailSeo } from '../to-detail-seo';
import { toLexicalJSON } from '../to-lexical-json';
import { toMediaRef } from '../to-media-ref';

import type { WorkRowDTO } from '@napochaan/cms-api/services';
import type { Work } from '@payload-types';

// Maps a Payload `works` document to `WorkRowDTO`. `no` is the display ordinal,
// supplied by the caller from list order. Absent optional fields are left out of
// the object entirely. Pure.
export const projectWorkRow = (doc: Work, no: string): WorkRowDTO => {
  const at = dayjs(doc.date).tz('Asia/Tokyo');
  const url = doc.url ?? undefined;
  const thumbnail = toMediaRef(doc.thumbnail);
  const description = doc.description ?? undefined;
  const bodyJSON = toLexicalJSON(doc.body);
  const seo = toDetailSeo(doc.meta);

  return {
    id: `${doc.id}`,
    slug: doc.slug,
    no,
    title: doc.title,
    type: doc.type,
    year: at.year(),
    date: at.format('YYYY-MM-DD'),
    ...(url !== undefined && { url }),
    ...(thumbnail !== undefined && { thumbnail }),
    ...(description !== undefined && { description }),
    ...(bodyJSON !== undefined && { bodyJSON }),
    ...(seo !== undefined && { seo }),
  };
};
