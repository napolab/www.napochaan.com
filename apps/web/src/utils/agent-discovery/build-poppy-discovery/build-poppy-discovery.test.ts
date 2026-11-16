import { describe, expect, it } from 'vitest';

import { buildPoppyDiscovery } from './index';

describe('buildPoppyDiscovery', () => {
  it('declares website-only Personal Agent Protocol 0.1 discovery for the site organization', () => {
    expect(buildPoppyDiscovery({ baseUrl: 'https://napochaan.com' })).toEqual({ protocol_version: '0.1', organization: { name: 'napochaan', domain: 'napochaan.com' }, web: {} });
  });

  // The domain must match the hostname of the requested well-known URL.
  it('uses the host of the deployed origin (staging)', () => {
    expect(buildPoppyDiscovery({ baseUrl: 'https://stg.napochaan.com' }).organization.domain).toBe('stg.napochaan.com');
  });
});
