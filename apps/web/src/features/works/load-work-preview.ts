import { findWorkDraftById, findWorksList } from '@lib/cms/works';

import { adjacentWorks } from './lib/adjacent-works';
import { relatedWorks } from './lib/related-works';

import type { WorkDetail } from './load-work-detail';

// The draft preview's data (port of works/preview/[id]/page.tsx): the latest draft by
// id (undefined → 404); neighbours and related works come from the published list.
export const loadWorkPreview = async (id: string, previewSecret: string): Promise<WorkDetail | undefined> => {
  const work = await findWorkDraftById(id, previewSecret);
  if (work === undefined) return undefined;

  const works = await findWorksList();

  return { work, adjacent: adjacentWorks(works, work.slug), related: relatedWorks(works, work) };
};
