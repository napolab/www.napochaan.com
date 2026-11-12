import { projectProfile } from '../project/profile';

import type { PayloadRunner } from '../payload-runner';
import type { CMSServices, ProfileDTO } from '@napochaan/cms-api/services';

// The `profile` global (single document).
export const createProfileService = (run: PayloadRunner): CMSServices['profile'] => ({
  async get(): Promise<ProfileDTO | undefined> {
    const global = await run((payload) => payload.findGlobal({ slug: 'profile' }));

    return projectProfile(global);
  },
});
