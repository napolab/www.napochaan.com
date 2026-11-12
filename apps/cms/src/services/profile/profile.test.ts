import { describe, expect, it } from 'vitest';

import { createFakeRunner } from '../payload-runner/fake';

import { createProfileService } from './index';

describe('createProfileService', () => {
  it('get() reads the profile global and projects it', async () => {
    const { run, findGlobal } = createFakeRunner({ global: { name: 'naporitan', love: [{ id: 'a', value: 'dubstep' }], skillGroups: null, contacts: null } });

    const profile = await createProfileService(run).get();

    expect(findGlobal).toHaveBeenCalledWith({ slug: 'profile' });
    expect(profile?.name).toBe('naporitan');
    expect(profile?.love).toEqual(['dubstep']);
  });
});
