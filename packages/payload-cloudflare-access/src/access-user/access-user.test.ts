import { describe, expect, test } from 'vitest';

import { ACCESS_STRATEGY_NAME, isCloudflareAccessUser } from './index';

describe('isCloudflareAccessUser', () => {
  test('names the strategy cloudflare-access', () => {
    expect(ACCESS_STRATEGY_NAME).toBe('cloudflare-access');
  });

  test('accepts a user authenticated by the cloudflare-access strategy', () => {
    expect(isCloudflareAccessUser({ id: 1, _strategy: 'cloudflare-access' })).toBe(true);
  });

  test.each([{ _strategy: 'local-jwt' }, { _strategy: 'api-key' }, { id: 1 }])('rejects a user from another strategy (%j)', (user) => {
    expect(isCloudflareAccessUser(user)).toBe(false);
  });

  test.each([null, undefined])('rejects %s', (user) => {
    expect(isCloudflareAccessUser(user)).toBe(false);
  });
});
