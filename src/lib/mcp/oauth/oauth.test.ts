import { describe, expect, it } from 'vitest';

import { getOAuthHelpers } from '.';

describe('getOAuthHelpers', () => {
  it('returns undefined for env without OAUTH_PROVIDER', () => {
    expect(getOAuthHelpers({})).toBeUndefined();
    expect(getOAuthHelpers(undefined)).toBeUndefined();
    expect(getOAuthHelpers(null)).toBeUndefined();
  });

  it('returns the injected helpers object', () => {
    const helpers = { parseAuthRequest: async () => ({}) };
    expect(getOAuthHelpers({ OAUTH_PROVIDER: helpers })).toBe(helpers);
  });
});
