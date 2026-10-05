import { describe, expect, test } from 'vitest';

import { ACCESS_LOGOUT_BUTTON_PATH, cloudflareAccessPlugin } from './index';

import type { Config } from 'payload';

const unusedDatabaseInit = (): never => {
  throw new Error('the database adapter is not used in plugin unit tests');
};

const baseConfig = {
  admin: { user: 'users' },
  collections: [{ slug: 'users', auth: true, fields: [] }],
  db: { defaultIDType: 'number', init: unusedDatabaseInit },
  secret: 'test-secret',
} satisfies Config;

describe('cloudflareAccessPlugin', () => {
  test('registers the logout button even when Access is not configured', async () => {
    const config = await cloudflareAccessPlugin({ teamDomain: undefined, aud: undefined })(baseConfig);

    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: false },
    });
  });
});
