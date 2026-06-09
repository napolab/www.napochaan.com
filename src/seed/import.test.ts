import { afterEach, describe, expect, it, vi } from 'vitest';

import { ensureAdminUser, importContent, importSeedData } from './import';

import type { Payload } from 'payload';

// Mock node:fs/promises so the import routines see empty collection arrays and
// an empty profile object — deterministic, no real data dir touched. vitest
// hoists vi.mock above the imports, so the SUT picks up the mock.
// `readFile`: profile.json -> '{}' (importProfile needs an object), every other
// *.json -> '[]' (all collection arrays empty). `readdir` -> [] (no assets).
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async (target: string) => (target.endsWith('profile.json') ? '{}' : '[]')),
  readdir: vi.fn(async () => []),
}));

type CreateCall = { collection: string };

// Fake Payload that records every create() call's target collection. find()
// always returns empty so every upsert takes the create() branch; the other
// mutators just resolve.
const makeFakePayload = (): { payload: Payload; creates: CreateCall[] } => {
  const creates: CreateCall[] = [];
  const fake = {
    find: async () => ({ docs: [] }),
    create: async ({ collection }: CreateCall) => {
      creates.push({ collection });
      return { id: 1 };
    },
    update: async () => ({ id: 1 }),
    delete: async () => ({}),
    updateGlobal: async () => ({}),
    logger: { info: () => {}, warn: () => {} },
  };

  return { payload: fake as unknown as Payload, creates };
};

const countUserCreates = (creates: readonly CreateCall[]): number => creates.filter((call) => call.collection === 'users').length;

describe('seed import — production safety invariant', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('importContent never creates a users row', async () => {
    const { payload, creates } = makeFakePayload();
    await importContent(payload);
    expect(countUserCreates(creates)).toBe(0);
  });

  it('importSeedData creates exactly one users row (dev admin)', async () => {
    const { payload, creates } = makeFakePayload();
    await importSeedData(payload);
    expect(countUserCreates(creates)).toBe(1);
  });

  it('ensureAdminUser is exported and creates the dev admin when absent', async () => {
    const { payload, creates } = makeFakePayload();
    await ensureAdminUser(payload);
    expect(countUserCreates(creates)).toBe(1);
  });
});
