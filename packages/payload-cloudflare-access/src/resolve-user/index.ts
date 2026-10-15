import type { CollectionSlug, Payload, TypedUser } from 'payload';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import { ResolveUserError } from '../errors';
import type { AccessIdentity } from '../verify';

// Payload の find/create が返す doc には runtime の `collection` が無い。`collection` / `_strategy` は strategy 側で足す。
export type AccessUser = Omit<TypedUser, 'collection'>;

export type UserStore = {
  findByEmail: (email: string) => Promise<AccessUser | undefined>;
  create: (email: string) => Promise<AccessUser>;
};

// `collection` 引数は CollectionSlug 全体なので、find/create の戻り値は全 collection の doc の union になる。
// auth collection(email を持つ)であることを実行時に確かめて AccessUser に絞る。
// 検査するのは load-bearing な `email` と `id` だけで、他のフィールドの形までは保証しない。
const isAccessUser = (doc: unknown): doc is AccessUser => typeof doc === 'object' && doc !== null && 'id' in doc && 'email' in doc && typeof doc.email === 'string';

const toAccessUser = (doc: unknown): AccessUser => {
  if (!isAccessUser(doc)) throw new TypeError('The configured collection did not return an auth user (no email field)');
  return doc;
};

// local API を `overrideAccess: true` で呼ぶので、`users.access.create`(最初の 1 人だけ許可)はここでは効かない。
// 認可の境界は Cloudflare Access のポリシーだけ(spec R4)。ロールは持たず、Access を通った email は全員 admin として扱う。
// password は渡さない。users collection は `disableLocalStrategy: { enableFields: true }` で email/hash 列だけ残している。
export const createPayloadUserStore = (payload: Pick<Payload, 'find' | 'create'>, collection: CollectionSlug): UserStore => ({
  async findByEmail(email) {
    const { docs } = await payload.find({
      collection,
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const [doc] = docs;
    return doc === undefined ? undefined : toAccessUser(doc);
  },
  async create(email) {
    const doc = await payload.create({
      collection,
      data: { email },
      overrideAccess: true,
    });
    return toAccessUser(doc);
  },
});

const findUser = (store: UserStore, email: string): ResultAsync<AccessUser | undefined, ResolveUserError> => ResultAsync.fromPromise(store.findByEmail(email), (cause) => new ResolveUserError(cause));

// 初回アクセスでは admin が XHR を並走させるので create が unique 制約で競合しうる。
// create が失敗したら再 find し、勝者が居ればそれを返す。居なければ create の失敗をそのまま返す。
const createOrRefind = (store: UserStore, email: string): ResultAsync<AccessUser, ResolveUserError> =>
  ResultAsync.fromPromise(store.create(email), (cause) => new ResolveUserError(cause)).orElse((createError) =>
    findUser(store, email).andThen((winner) => (winner === undefined ? errAsync(createError) : okAsync(winner))),
  );

export const resolveAccessUser = (store: UserStore, identity: AccessIdentity): ResultAsync<AccessUser, ResolveUserError> => {
  const email = identity.email.toLowerCase();

  return findUser(store, email).andThen((existing) => (existing === undefined ? createOrRefind(store, email) : okAsync(existing)));
};
