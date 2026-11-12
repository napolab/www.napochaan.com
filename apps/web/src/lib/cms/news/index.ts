import { isBuildPhase } from '../build-phase';
import { getCMSClient } from '@lib/cms/client';
import { fromNewsItemDTO } from '../from-dto/news-item';
import { assertOK } from '../response-error';

import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';

// Published reads go through the cms `/news` routes (pinned first, then newest).
// 404 → undefined; other non-2xx throw.
export const findNewsList = async (): Promise<readonly NewsItem[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.news.$get({ query: {} });
  assertOK('GET /news', res);

  return (await res.json()).map(fromNewsItemDTO);
};

export const findNewsBySlug = async (slug: string): Promise<NewsItem | undefined> => {
  if (isBuildPhase()) return undefined;

  const cms = await getCMSClient();
  const res = await cms.news[':slug'].$get({ param: { slug: encodeURIComponent(slug) } });
  if (res.status === 404) return undefined;
  assertOK('GET /news/:slug', res);

  return fromNewsItemDTO(await res.json());
};

// Latest draft regardless of `_status`, gated by the preview secret on the cms
// side. Only reachable from the draft-mode preview route. 403 / 404 → undefined.
export const findNewsDraftById = async (id: string, previewSecret: string): Promise<NewsItem | undefined> => {
  if (isBuildPhase()) return undefined;

  const cms = await getCMSClient();
  const res = await cms.drafts.news[':id'].$get({ param: { id: encodeURIComponent(id) }, header: { 'x-preview-secret': previewSecret } });
  if (res.status === 403 || res.status === 404) return undefined;
  assertOK('GET /drafts/news/:id', res);

  return fromNewsItemDTO(await res.json());
};

// `limit` must be 1–50 (the cms validates it; anything else is a 400 → throw).
export const findLatestNews = async (limit: number): Promise<readonly NewsItem[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.news.$get({ query: { limit: `${limit}` } });
  assertOK('GET /news?limit=', res);

  return (await res.json()).map(fromNewsItemDTO);
};
