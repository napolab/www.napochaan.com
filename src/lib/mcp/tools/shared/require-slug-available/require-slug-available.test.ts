import { vi, describe, expect, it } from 'vitest';

import { requireSlugAvailable } from '.';

import type { Payload } from 'payload';

const makePayload = (docs: readonly unknown[]) => {
  const find = vi.fn().mockResolvedValue({ docs });

  return { find, payload: { find } as unknown as Payload };
};

describe('requireSlugAvailable', () => {
  it('slug が未使用なら ok を返す', async () => {
    const { payload } = makePayload([]);

    const result = await requireSlugAvailable(payload, 'blog', 'fresh-slug', 'update_post');

    expect(result.isOk()).toBe(true);
  });

  it('slug が既に使われていたら slug と更新 tool 名を含む回復ヒントで err', async () => {
    const { payload } = makePayload([{ id: 1 }]);

    const result = await requireSlugAvailable(payload, 'legal-documents', 'terms', 'update_legal_document');

    expect(result.isErr()).toBe(true);
    const message = result.isErr() ? result.error.message : '';
    expect(message).toContain('terms');
    expect(message).toContain('update_legal_document');
  });

  it('overrideAccess:true / draft:true で slug 存在を確認する(access/status を無視)', async () => {
    const { find, payload } = makePayload([]);

    await requireSlugAvailable(payload, 'blog', 'x', 'update_post');

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'blog',
        where: { slug: { equals: 'x' } },
        overrideAccess: true,
        draft: true,
        limit: 1,
      }),
    );
  });
});
