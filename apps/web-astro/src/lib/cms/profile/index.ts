import { getCMSClient } from '@lib/cms/client';
import { fromProfileDTO } from '../from-dto/profile';
import { assertOK } from '../response-error';

import type { Profile } from '../../../features/about/profile';

// The `profile` global. 404 (not yet authored) → undefined; other non-2xx throw.
export const findProfile = async (): Promise<Profile | undefined> => {
  const cms = getCMSClient();
  const res = await cms.profile.$get();
  if (res.status === 404) return undefined;
  assertOK('GET /profile', res);

  return fromProfileDTO(await res.json());
};
