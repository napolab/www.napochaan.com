import { isBuildPhase } from '../build-phase';
import { getCMSClient } from '@lib/cms/client';
import { fromPostDTO } from '../from-dto/post';
import { assertOK } from '../response-error';

import type { Post } from '../../../app/(site)/blog/_lib/post';

// Published reads go through the cms `/blog` routes (published filter, ordinals
// and readMin are computed there). 404 → undefined; other non-2xx throw.
export const findBlogList = async (): Promise<readonly Post[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.blog.$get();
  assertOK('GET /blog', res);

  return (await res.json()).map(fromPostDTO);
};

export const findBlogBySlug = async (slug: string): Promise<Post | undefined> => {
  if (isBuildPhase()) return undefined;

  const cms = await getCMSClient();
  const res = await cms.blog[':slug'].$get({ param: { slug: encodeURIComponent(slug) } });
  if (res.status === 404) return undefined;
  assertOK('GET /blog/:slug', res);

  return fromPostDTO(await res.json());
};

// Latest draft regardless of `_status`, gated by the preview secret on the cms
// side. Only reachable from the draft-mode preview route. 403 / 404 → undefined.
export const findBlogDraftById = async (id: string, previewSecret: string): Promise<Post | undefined> => {
  if (isBuildPhase()) return undefined;

  const cms = await getCMSClient();
  const res = await cms.drafts.blog[':id'].$get({ param: { id: encodeURIComponent(id) }, header: { 'x-preview-secret': previewSecret } });
  if (res.status === 403 || res.status === 404) return undefined;
  assertOK('GET /drafts/blog/:id', res);

  return fromPostDTO(await res.json());
};
