import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const context = vi.hoisted(() => ({ env: { PREVIEW_SECRET: 'right' } as { PREVIEW_SECRET?: string } }));
const draft = vi.hoisted(() => ({ enable: vi.fn(), disable: vi.fn() }));
const redirect = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
);

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (options?: { async?: boolean }) => {
    if (options?.async !== true) throw new Error('getCloudflareContext called in sync mode');
    return Promise.resolve(context);
  },
}));
vi.mock('next/headers', () => ({ draftMode: async () => draft }));
vi.mock('next/navigation', () => ({ redirect }));

const call = async (query: string) => GET(new Request(`http://localhost/next/preview?${query}`));

beforeEach(() => {
  context.env = { PREVIEW_SECRET: 'right' };
  draft.enable.mockClear();
  draft.disable.mockClear();
  redirect.mockClear();
});

describe('GET /next/preview', () => {
  it('rejects a wrong previewSecret with 403 without enabling draft mode', async () => {
    const res = await call('previewSecret=wrong&path=/blog/preview/1');

    expect(res.status).toBe(403);
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it('rejects a missing previewSecret with 403', async () => {
    const res = await call('path=/blog/preview/1');

    expect(res.status).toBe(403);
  });

  it.each([{ PREVIEW_SECRET: '' }, {}])('rejects an empty submitted secret when the configured secret is unset (%o)', async (env) => {
    context.env = env;

    const res = await call('previewSecret=&path=/blog/preview/1');

    expect(res.status).toBe(403);
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it('rejects a non-preview path with 400 even with the right secret', async () => {
    const res = await call('previewSecret=right&path=//evil.example');

    expect(res.status).toBe(400);
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it('enables draft mode and redirects to the preview path with the right secret', async () => {
    await expect(call('previewSecret=right&path=/blog/preview/1')).rejects.toThrow('NEXT_REDIRECT:/blog/preview/1');

    expect(draft.enable).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith('/blog/preview/1');
  });
});
