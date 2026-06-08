import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toProfile } from './to-profile';

import type { Profile } from '../../../app/(site)/about/_lib/profile';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const fetchProfile = unstable_cache(
  async (): Promise<Profile | undefined> => {
    const payload = await getPayloadClient();
    const global = await payload.findGlobal({ slug: 'profile' });

    return toProfile(global);
  },
  ['profile'],
  { tags: [CACHE_TAGS.profile] },
);

export const findProfile = async (): Promise<Profile | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchProfile();
};
