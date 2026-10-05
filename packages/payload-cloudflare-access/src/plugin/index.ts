import { AccessTargetCollectionNotFound } from '../errors';
import { createAccessStrategy } from '../strategy';
import { createAccessKeys } from '../verify';

import type { CollectionConfig, Config, Plugin, TypedUser } from 'payload';

export const ACCESS_LOGOUT_BUTTON_PATH = '@napolab/payload-cloudflare-access/client/logout-button#LogoutButton';

export type CloudflareAccessPluginOptions = {
  teamDomain: string | undefined;
  aud: string | undefined;
  collection?: string;
};

export const parseAudiences = (raw: string | undefined): readonly string[] =>
  (raw ?? '')
    .split(',')
    .map((audience) => audience.trim())
    .filter((audience) => audience !== '');

type EnabledOptions = { teamDomain: string; aud: readonly string[] };

const resolveEnabledOptions = (options: CloudflareAccessPluginOptions): EnabledOptions | undefined => {
  const aud = parseAudiences(options.aud);
  if (options.teamDomain === undefined || options.teamDomain === '') return undefined;
  if (aud.length === 0) return undefined;

  return { teamDomain: options.teamDomain, aud };
};

const isAuthCollection = (collection: CollectionConfig): boolean => collection.auth !== undefined && collection.auth !== false;

// Payload の結果型は `TypedUser['collection']` を要求するが、config 上の slug は string。
// 型は実行時に絞れないので、少なくとも config 上に存在する auth collection であることを確かめてから絞る。
const isAuthCollectionSlug = (slug: string, collections: readonly CollectionConfig[]): slug is TypedUser['collection'] =>
  collections.some((collection) => collection.slug === slug && isAuthCollection(collection));

const withAccessAuth = (collection: CollectionConfig, strategy: ReturnType<typeof createAccessStrategy>): CollectionConfig => {
  const auth = typeof collection.auth === 'object' ? collection.auth : {};

  return {
    ...collection,
    auth: {
      ...auth,
      strategies: [...(auth.strategies ?? []), strategy],
      disableLocalStrategy: { enableFields: true },
    },
  };
};

// 対象は `options.collection` -> `admin.user` -> 最初の auth collection(Payload の sanitize と同じ既定)の順。
// Access の env が設定済みなのに対象が解決できない場合は throw する。黙って無効にすると password ログインが残る(fail-open)。
const resolveTargetSlug = (options: CloudflareAccessPluginOptions, config: Config): TypedUser['collection'] => {
  const collections = config.collections ?? [];
  const slug = options.collection ?? config.admin?.user ?? collections.find(isAuthCollection)?.slug;
  if (slug === undefined || !isAuthCollectionSlug(slug, collections)) throw new AccessTargetCollectionNotFound(slug);

  return slug;
};

const enableAccessAuth = (config: Config, enabled: EnabledOptions, target: TypedUser['collection']): Config => {
  // JWKS は 1 回だけ作る(jose がキャッシュを持つ)。
  const strategy = createAccessStrategy({ ...enabled, collection: target, keys: createAccessKeys(enabled.teamDomain) });

  return {
    ...config,
    collections: (config.collections ?? []).map((collection) => (collection.slug === target ? withAccessAuth(collection, strategy) : collection)),
  };
};

export const cloudflareAccessPlugin =
  (options: CloudflareAccessPluginOptions): Plugin =>
  (config: Config): Config => {
    const enabledOptions = resolveEnabledOptions(options);
    const authConfig = enabledOptions === undefined ? config : enableAccessAuth(config, enabledOptions, resolveTargetSlug(options, config));

    return {
      ...authConfig,
      admin: {
        ...authConfig.admin,
        components: {
          ...authConfig.admin?.components,
          logout: {
            ...authConfig.admin?.components?.logout,
            Button: {
              path: ACCESS_LOGOUT_BUTTON_PATH,
              clientProps: { accessLogout: enabledOptions !== undefined },
            },
          },
        },
      },
    };
  };
