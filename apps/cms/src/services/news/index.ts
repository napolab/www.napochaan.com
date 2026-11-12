import { projectNewsItem } from '../project/news';

import type { PayloadRunner } from '../payload-runner';
import type { NewsItemDTO, NewsService } from '@napochaan/cms-api/services';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Pinned items first (the `pinned` checkbox), then newest by date.
const newsSort = ['-pinned', '-publishedAt'];

// Public news reads. Drafts bypass the published filter and are only reachable
// through the secret-gated preview route.
export const createNewsService = (run: PayloadRunner): NewsService => ({
  async list(): Promise<NewsItemDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'news', where: publishedWhere, sort: newsSort, limit: 0 }));

    return result.docs.map(projectNewsItem);
  },
  async latest(limit: number): Promise<NewsItemDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'news', where: publishedWhere, sort: newsSort, limit }));

    return result.docs.map(projectNewsItem);
  },
  async bySlug(slug: string): Promise<NewsItemDTO | undefined> {
    const result = await run((payload) => payload.find({ collection: 'news', where: { and: [{ slug: { equals: slug } }, publishedWhere] }, limit: 1 }));
    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return projectNewsItem(doc);
  },
  async draft(id: string): Promise<NewsItemDTO | undefined> {
    const result = await run((payload) => payload.find({ collection: 'news', where: { id: { equals: id } }, draft: true, overrideAccess: true, limit: 1 }));
    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return projectNewsItem(doc);
  },
});
