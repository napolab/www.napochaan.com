import { describe, expect, it } from 'vitest';

import { frameWith, redirectTo } from './index';

describe('redirectTo', () => {
  it('builds a redirect action to the location', () => {
    expect(redirectTo('/admin')).toEqual({ kind: 'redirect', location: '/admin' });
  });
});

describe('frameWith', () => {
  it('builds a frame action carrying the policy', () => {
    const policy = { frameAncestors: "frame-ancestors 'self'", xFrameOptions: 'SAMEORIGIN' };

    expect(frameWith(policy)).toEqual({ kind: 'frame', policy });
  });
});
