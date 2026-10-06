import { describe, expect, test, vi } from 'vitest';

import { ResolveUserError } from '../errors';
import { createPayloadUserStore, resolveAccessUser } from './index';
import type { AccessUser, UserStore } from './index';

const userOf = (email: string): AccessUser => ({ id: 1, email, updatedAt: '2026-10-05T00:00:00.000Z', createdAt: '2026-10-05T00:00:00.000Z' });

describe('resolveAccessUser', () => {
  test('returns an existing user', async () => {
    const existing = userOf('napo@example.com');
    const create = vi.fn<UserStore['create']>();
    const store: UserStore = { findByEmail: async () => existing, create };

    const result = await resolveAccessUser(store, { email: 'napo@example.com' });

    expect(result._unsafeUnwrap()).toBe(existing);
    expect(create).not.toHaveBeenCalled();
  });

  test('creates a user for an unknown email', async () => {
    const created = userOf('napo@example.com');
    const create = vi.fn<UserStore['create']>(async () => created);
    const store: UserStore = { findByEmail: async () => undefined, create };

    const result = await resolveAccessUser(store, { email: 'napo@example.com' });

    expect(result._unsafeUnwrap()).toBe(created);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith('napo@example.com');
  });

  test('normalizes email case', async () => {
    const existing = userOf('napo@example.com');
    const findByEmail = vi.fn<UserStore['findByEmail']>(async (email) => (email === 'napo@example.com' ? existing : undefined));
    const create = vi.fn<UserStore['create']>();

    const result = await resolveAccessUser({ findByEmail, create }, { email: 'Napo@Example.COM' });

    expect(result._unsafeUnwrap()).toBe(existing);
    expect(create).not.toHaveBeenCalled();
  });

  test('refinds after a failed create', async () => {
    const winner = userOf('napo@example.com');
    const findByEmail = vi.fn<UserStore['findByEmail']>().mockResolvedValueOnce(undefined).mockResolvedValueOnce(winner);
    const create = vi.fn<UserStore['create']>(async () => {
      throw new Error('duplicate email');
    });

    const result = await resolveAccessUser({ findByEmail, create }, { email: 'napo@example.com' });

    expect(result._unsafeUnwrap()).toBe(winner);
    expect(findByEmail).toHaveBeenCalledTimes(2);
  });

  test('fails when create fails and the user is still missing', async () => {
    const cause = new Error('db down');
    const store: UserStore = {
      findByEmail: async () => undefined,
      create: async () => {
        throw cause;
      },
    };

    const result = await resolveAccessUser(store, { email: 'napo@example.com' });

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ResolveUserError);
    expect(error.cause).toBe(cause);
  });

  test('fails when find throws', async () => {
    const cause = new Error('db down');
    const create = vi.fn<UserStore['create']>();
    const store: UserStore = {
      findByEmail: async () => {
        throw cause;
      },
      create,
    };

    const result = await resolveAccessUser(store, { email: 'napo@example.com' });

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ResolveUserError);
    expect(error.cause).toBe(cause);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('createPayloadUserStore', () => {
  test('findByEmail queries the collection with overrideAccess', async () => {
    const found = userOf('napo@example.com');
    const find = vi.fn().mockResolvedValue({ docs: [found] });
    const create = vi.fn();

    const store = createPayloadUserStore({ find, create }, 'users');

    await expect(store.findByEmail('napo@example.com')).resolves.toEqual(found);
    expect(find).toHaveBeenCalledWith({
      collection: 'users',
      where: { email: { equals: 'napo@example.com' } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
  });

  test('findByEmail returns undefined when nothing matches', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] });

    const store = createPayloadUserStore({ find, create: vi.fn() }, 'users');

    await expect(store.findByEmail('napo@example.com')).resolves.toBeUndefined();
  });

  test('create inserts a passwordless user with overrideAccess', async () => {
    const created = userOf('napo@example.com');
    const create = vi.fn().mockResolvedValue(created);

    const store = createPayloadUserStore({ find: vi.fn(), create }, 'users');

    await expect(store.create('napo@example.com')).resolves.toEqual(created);
    expect(create).toHaveBeenCalledWith({
      collection: 'users',
      data: { email: 'napo@example.com' },
      overrideAccess: true,
    });
  });
});
