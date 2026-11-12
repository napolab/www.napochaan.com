import { isBuildPhase } from '../build-phase';
import { getCMSClient } from '@lib/cms/client';
import { fromWorkRowDTO } from '../from-dto/work-row';
import { assertOK } from '../response-error';

import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

// Published reads go through the cms `/works` routes (newest first, ordinals
// computed there). 404 → undefined; other non-2xx throw.
export const findWorksList = async (): Promise<readonly WorkRow[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.works.$get();
  assertOK('GET /works', res);

  return (await res.json()).map(fromWorkRowDTO);
};

export const findWorkBySlug = async (slug: string): Promise<WorkRow | undefined> => {
  if (isBuildPhase()) return undefined;

  const cms = await getCMSClient();
  const res = await cms.works[':slug'].$get({ param: { slug: encodeURIComponent(slug) } });
  if (res.status === 404) return undefined;
  assertOK('GET /works/:slug', res);

  return fromWorkRowDTO(await res.json());
};

// Latest draft regardless of `_status`, gated by the preview secret on the cms
// side. Only reachable from the draft-mode preview route. 403 / 404 → undefined.
export const findWorkDraftById = async (id: string, previewSecret: string): Promise<WorkRow | undefined> => {
  if (isBuildPhase()) return undefined;

  const cms = await getCMSClient();
  const res = await cms.drafts.works[':id'].$get({ param: { id: encodeURIComponent(id) }, header: { 'x-preview-secret': previewSecret } });
  if (res.status === 403 || res.status === 404) return undefined;
  assertOK('GET /drafts/works/:id', res);

  return fromWorkRowDTO(await res.json());
};
