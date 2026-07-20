import { afterEach, describe, expect, it, vi } from 'vitest';

import { findLegalDocumentBySlug } from '.';

const find = vi.fn();

vi.mock('@lib/payload/client', () => ({
  getPayloadClient: async () => ({ find }),
}));

// unstable_cache は素通しで実装を呼ぶモックにする(next/cache の実体はテスト環境に無い)。
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe('findLegalDocumentBySlug', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('published のみを引く where 条件で問い合わせる', async () => {
    find.mockResolvedValue({ docs: [{ id: 1, slug: 'terms' }] });

    await findLegalDocumentBySlug('terms');

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'legal-documents',
        where: { and: [{ slug: { equals: 'terms' } }, { _status: { equals: 'published' } }] },
        limit: 1,
      }),
    );
  });

  it('該当が無ければ undefined を返す', async () => {
    find.mockResolvedValue({ docs: [] });

    await expect(findLegalDocumentBySlug('missing')).resolves.toBeUndefined();
  });

  it('該当があればその doc を返す', async () => {
    find.mockResolvedValue({ docs: [{ id: 1, slug: 'terms', title: '利用規約' }] });

    await expect(findLegalDocumentBySlug('terms')).resolves.toEqual({ id: 1, slug: 'terms', title: '利用規約' });
  });
});
