import { projectPost } from '../project/blog';

import type { PayloadRunner } from '../payload-runner';
import type { CMSServices, PostDTO } from '@napochaan/cms-api/services';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Two-digit display ordinal from a zero-based index: 0 -> '01'.
const ordinal = (index: number): string => `${index + 1}`.padStart(2, '0');

// Public blog reads. `depth` is left at Payload's default (2) so body upload nodes
// and the thumbnail arrive populated. Drafts bypass the published filter and are
// only reachable through the secret-gated preview route.
export const createBlogService = (run: PayloadRunner): CMSServices['blog'] => ({
  async list(): Promise<PostDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'blog', where: publishedWhere, sort: '-publishedAt', limit: 0 }));

    return result.docs.map((doc, index) => projectPost(doc, ordinal(index)));
  },
  async bySlug(slug: string): Promise<PostDTO | undefined> {
    const result = await run((payload) => payload.find({ collection: 'blog', where: { and: [{ slug: { equals: slug } }, publishedWhere] }, limit: 1 }));
    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return projectPost(doc, '01');
  },
  async draft(id: string): Promise<PostDTO | undefined> {
    const result = await run((payload) => payload.find({ collection: 'blog', where: { id: { equals: id } }, draft: true, overrideAccess: true, limit: 1 }));
    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return projectPost(doc, '01');
  },
});
