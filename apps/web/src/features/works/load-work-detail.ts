import { findWorkBySlug, findWorksList } from '@lib/cms/works';

import { adjacentWorks } from './lib/adjacent-works';
import { relatedWorks } from './lib/related-works';

import type { Adjacent } from './lib/adjacent-works';
import type { WorkRow } from './work-row';

export type WorkDetail = {
  work: WorkRow;
  adjacent: Adjacent;
  related: readonly WorkRow[];
};

// The detail page's data: the work (undefined → the route's 404), its neighbours in
// the archive order and up to three same-type siblings. A publish purges every page at
// once, so neither goes stale.
export const loadWorkDetail = async (slug: string): Promise<WorkDetail | undefined> => {
  const work = await findWorkBySlug(slug);
  if (work === undefined) return undefined;

  const works = await findWorksList();

  return { work, adjacent: adjacentWorks(works, slug), related: relatedWorks(works, work) };
};
