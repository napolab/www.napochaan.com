import { projectWorkRow } from '../project/works';

import type { PayloadRunner } from '../payload-runner';
import type { CMSServices, WorkRowDTO } from '@napochaan/cms-api/services';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Two-digit display ordinal from a zero-based index: 0 -> '01'.
const ordinal = (index: number): string => `${index + 1}`.padStart(2, '0');

// Public works reads at depth 1 (the thumbnail is the only relation consumed).
// Drafts bypass the published filter and are only reachable through the
// secret-gated preview route.
export const createWorksService = (run: PayloadRunner): CMSServices['works'] => ({
  async list(): Promise<WorkRowDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'works', where: publishedWhere, sort: '-date', depth: 1, limit: 0 }));

    return result.docs.map((doc, index) => projectWorkRow(doc, ordinal(index)));
  },
  async bySlug(slug: string): Promise<WorkRowDTO | undefined> {
    const result = await run((payload) => payload.find({ collection: 'works', where: { and: [{ slug: { equals: slug } }, publishedWhere] }, depth: 1, limit: 1 }));
    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return projectWorkRow(doc, '01');
  },
  async draft(id: string): Promise<WorkRowDTO | undefined> {
    const result = await run((payload) => payload.find({ collection: 'works', where: { id: { equals: id } }, draft: true, overrideAccess: true, depth: 1, limit: 1 }));
    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return projectWorkRow(doc, '01');
  },
});
