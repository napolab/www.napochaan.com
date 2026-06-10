import { readdir, readFile } from 'node:fs/promises';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ensureAdminUser, importBlog, importContent, importSeedData } from './import';

import { richTextFromBlocks } from '@utils/sample-rich-text';

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

// A media-aware fake Payload: media find() misses (so ensureMedia creates a row),
// each media create() hands back an incrementing id, and the blog upsert's data is
// captured so the resolved body can be asserted. Other collections behave like the
// production-safety fake (empty find -> create branch).
type WriteCall = { collection: string; data?: Record<string, unknown> };
const makeMediaFakePayload = (): { payload: Payload; writes: WriteCall[]; nextMediaId: () => number } => {
  const writes: WriteCall[] = [];
  const mediaIds = { value: 100 };
  const fake = {
    find: async () => ({ docs: [] }),
    create: async ({ collection, data }: WriteCall) => {
      writes.push({ collection, data });
      if (collection === 'media') {
        mediaIds.value += 1;
        return { id: mediaIds.value };
      }
      return { id: 1 };
    },
    update: async ({ collection, data }: WriteCall) => {
      writes.push({ collection, data });
      return { id: 1 };
    },
    delete: async () => ({}),
    updateGlobal: async () => ({}),
    logger: { info: () => {}, warn: () => {} },
  };

  return { payload: fake as unknown as Payload, writes, nextMediaId: () => mediaIds.value };
};

// findAssetPath only reads .isFile() / .name / .parentPath, so a minimal stand-in
// suffices; cast at the mock boundary where node's Dirent generic is irrelevant.
type DirentLike = { name: string; isFile: () => boolean; parentPath: string };
const asDirent = (name: string): DirentLike => ({ name, isFile: () => true, parentPath: '/assets' });
const direntsOnce = (entries: readonly DirentLike[]): void => {
  vi.mocked(readdir).mockResolvedValueOnce(entries as unknown as Awaited<ReturnType<typeof readdir>>);
};

// Narrow the captured blog body enough to read back its upload nodes.
type BodyLike = { root: { children: { type: string; value?: unknown }[] } };
const uploadValuesOf = (data: Record<string, unknown> | undefined): unknown[] => {
  const body = data?.body as unknown as BodyLike;
  return body.root.children.filter((node) => node.type === 'upload').map((node) => node.value);
};

describe('importBlog — body image media resolution', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves an upload sentinel in the body to a numeric media id before upsert', async () => {
    const body = richTextFromBlocks([
      { type: 'p', text: 'intro' },
      { type: 'img', file: 'v3-hero.png', alt: 'hero' },
    ]);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify([{ title: 'post', body }]));
    direntsOnce([asDirent('v3-hero.png')]);

    const { payload, writes } = makeMediaFakePayload();
    await importBlog(payload);

    expect(writes.some((call) => call.collection === 'media')).toBe(true);
    const blogWrite = writes.find((call) => call.collection === 'blog');
    expect(uploadValuesOf(blogWrite?.data)).toEqual([101]);
  });

  it('drops an upload node whose asset is missing (ensureMedia returns undefined)', async () => {
    const body = richTextFromBlocks([
      { type: 'p', text: 'intro' },
      { type: 'img', file: 'missing.png', alt: 'gone' },
    ]);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify([{ title: 'post', body }]));
    direntsOnce([]);

    const { payload, writes } = makeMediaFakePayload();
    await importBlog(payload);

    const blogWrite = writes.find((call) => call.collection === 'blog');
    expect(uploadValuesOf(blogWrite?.data)).toEqual([]);
  });
});
