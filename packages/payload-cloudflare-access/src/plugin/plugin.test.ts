import { describe, expect, test } from 'vitest';

import { ACCESS_LOGOUT_BUTTON_PATH, cloudflareAccessPlugin, parseAudiences } from './index';

import type { AuthStrategy, CollectionConfig, Config } from 'payload';

const unusedDatabaseInit = (): never => {
  throw new Error('the database adapter is not used in plugin unit tests');
};

const strategyOf = (name: string): AuthStrategy => ({ name, authenticate: () => ({ user: null }) });

const usersCollection = { slug: 'users', auth: true, fields: [] } satisfies CollectionConfig;
const mediaCollection = { slug: 'media', fields: [] } satisfies CollectionConfig;
const newsCollection = { slug: 'news', fields: [] } satisfies CollectionConfig;

const configWith = (collections: CollectionConfig[]): Config => ({
  admin: { user: 'users' },
  collections,
  db: { defaultIDType: 'number', init: unusedDatabaseInit },
  secret: 'test-secret',
});

const baseConfig = configWith([usersCollection]);

const configured = { teamDomain: 'napolab', aud: 'aud-1' };

const collectionOf = (config: Config, slug: string): CollectionConfig | undefined => config.collections?.find((collection) => collection.slug === slug);

const authOf = (config: Config, slug: string) => {
  const auth = collectionOf(config, slug)?.auth;
  return typeof auth === 'object' ? auth : undefined;
};

describe('parseAudiences', () => {
  test('parses a comma-separated aud', () => {
    expect(parseAudiences('aud-1, aud-2,')).toEqual(['aud-1', 'aud-2']);
  });

  test('returns an empty list for undefined or blank input', () => {
    expect(parseAudiences(undefined)).toEqual([]);
    expect(parseAudiences(' , ')).toEqual([]);
  });
});

describe('cloudflareAccessPlugin', () => {
  test('leaves auth untouched when Access is not configured', async () => {
    const config = await cloudflareAccessPlugin({ teamDomain: undefined, aud: undefined })(baseConfig);

    expect(collectionOf(config, 'users')?.auth).toEqual(true);
    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: false },
    });
  });

  test.each([
    { teamDomain: 'napolab', aud: '' },
    { teamDomain: 'napolab', aud: ' , ' },
    { teamDomain: '', aud: 'aud-1' },
  ])('stays disabled when one option is empty (%j)', async (options) => {
    const config = await cloudflareAccessPlugin(options)(baseConfig);

    expect(collectionOf(config, 'users')?.auth).toEqual(true);
    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: false },
    });
  });

  test('treats a whitespace-only teamDomain as not configured', async () => {
    const config = await cloudflareAccessPlugin({ teamDomain: '  ', aud: 'aud-1' })(baseConfig);

    expect(collectionOf(config, 'users')?.auth).toEqual(true);
    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: false },
    });
  });

  // 空白が残ったままだと JWKS URL の host が不正になり createAccessKeys が throw する。
  // 有効化できていること自体が trim 済みの teamDomain が渡っている証拠になる。
  test('trims the teamDomain before enabling', async () => {
    const config = await cloudflareAccessPlugin({ teamDomain: ' napolab ', aud: 'aud-1' })(baseConfig);

    expect(authOf(config, 'users')?.strategies?.at(-1)?.name).toBe('cloudflare-access');
    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: true },
    });
  });

  test('adds the strategy and disables local login when configured', async () => {
    const config = await cloudflareAccessPlugin(configured)(baseConfig);
    const auth = authOf(config, 'users');

    expect(auth?.strategies?.at(-1)?.name).toBe('cloudflare-access');
    expect(auth?.disableLocalStrategy).toEqual({ enableFields: true });
    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: true },
    });
  });

  test('keeps existing strategies', async () => {
    const existing = strategyOf('existing');
    const config = await cloudflareAccessPlugin(configured)(configWith([{ ...usersCollection, auth: { strategies: [existing] } }]));

    expect(authOf(config, 'users')?.strategies?.map((strategy) => strategy.name)).toEqual(['existing', 'cloudflare-access']);
  });

  test('normalizes auth: true', async () => {
    const config = await cloudflareAccessPlugin(configured)(baseConfig);

    expect(typeof collectionOf(config, 'users')?.auth).toBe('object');
    expect(authOf(config, 'users')?.strategies).toHaveLength(1);
  });

  test('keeps the collection order', async () => {
    const config = await cloudflareAccessPlugin(configured)(configWith([mediaCollection, usersCollection, newsCollection]));

    expect(config.collections?.map((collection) => collection.slug)).toEqual(['media', 'users', 'news']);
  });

  test('targets options.collection over admin.user', async () => {
    const admins = { slug: 'admins', auth: true, fields: [] } satisfies CollectionConfig;
    const config = await cloudflareAccessPlugin({ ...configured, collection: 'admins' })(configWith([usersCollection, admins]));

    expect(collectionOf(config, 'users')?.auth).toEqual(true);
    expect(authOf(config, 'admins')?.strategies?.at(-1)?.name).toBe('cloudflare-access');
  });

  test('leaves other collections untouched', async () => {
    const config = await cloudflareAccessPlugin(configured)(configWith([mediaCollection, usersCollection]));

    expect(collectionOf(config, 'media')).toEqual(mediaCollection);
  });

  test('throws when Access is configured but the target is not an auth collection', async () => {
    const plugin = cloudflareAccessPlugin({ ...configured, collection: 'media' });

    await expect(async () => plugin(configWith([usersCollection, mediaCollection]))).rejects.toThrow(/"media" is not an auth collection/);
  });

  test('throws when Access is configured but the target slug does not exist', async () => {
    const plugin = cloudflareAccessPlugin({ ...configured, collection: 'ghosts' });

    await expect(async () => plugin(baseConfig)).rejects.toThrow(/"ghosts" is not an auth collection/);
  });

  test('throws when Access is configured but no auth collection exists', async () => {
    const plugin = cloudflareAccessPlugin(configured);

    await expect(async () => plugin({ ...configWith([mediaCollection]), admin: {} })).rejects.toThrow(/no auth collection exists/);
  });

  test('does not throw for an unknown target when Access is not configured', async () => {
    const plugin = cloudflareAccessPlugin({ teamDomain: undefined, aud: undefined, collection: 'ghosts' });

    const config = await plugin(baseConfig);

    expect(collectionOf(config, 'users')?.auth).toEqual(true);
  });

  test('falls back to the first auth collection when admin.user is undefined', async () => {
    const admins = { slug: 'admins', auth: true, fields: [] } satisfies CollectionConfig;
    const config = await cloudflareAccessPlugin(configured)({ ...configWith([mediaCollection, admins, usersCollection]), admin: {} });

    expect(authOf(config, 'admins')?.strategies?.at(-1)?.name).toBe('cloudflare-access');
    expect(collectionOf(config, 'users')?.auth).toEqual(true);
  });

  test('preserves existing admin components when registering the logout button', async () => {
    const withComponents: Config = {
      ...baseConfig,
      admin: {
        ...baseConfig.admin,
        components: {
          graphics: { Logo: '/components/logo#Logo' },
          logout: { Button: '/components/old-logout#OldLogout' },
        },
      },
    };

    const config = await cloudflareAccessPlugin(configured)(withComponents);

    expect(config.admin?.components?.graphics).toEqual({ Logo: '/components/logo#Logo' });
    expect(config.admin?.components?.logout?.Button).toEqual({
      path: ACCESS_LOGOUT_BUTTON_PATH,
      clientProps: { accessLogout: true },
    });
  });
});
