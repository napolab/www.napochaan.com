import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const context = vi.hoisted(() => ({ env: { CMS_ORIGIN: 'https://cms.napochaan.com' } as { CMS_ORIGIN?: string } }));
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

const call = async (query: string) => GET(new Request(`https://napochaan.com/next/exit-preview${query}`));

beforeEach(() => {
  context.env = { CMS_ORIGIN: 'https://cms.napochaan.com' };
  draft.disable.mockClear();
  redirect.mockClear();
});

describe('GET /next/exit-preview', () => {
  it('disables draft mode and goes home without a redirect param', async () => {
    await expect(call('')).rejects.toThrow('NEXT_REDIRECT:/');
    expect(draft.disable).toHaveBeenCalledOnce();
  });

  it('disables draft mode, then continues to the cms (logout chain)', async () => {
    const target = 'https://cms.napochaan.com/cdn-cgi/access/logout';
    await expect(call(`?redirect=${encodeURIComponent(target)}`)).rejects.toThrow(`NEXT_REDIRECT:${target}`);
    expect(draft.disable).toHaveBeenCalledOnce();
  });

  it('disables draft mode but refuses an open redirect', async () => {
    await expect(call(`?redirect=${encodeURIComponent('https://evil.example/')}`)).rejects.toThrow('NEXT_REDIRECT:/');
    expect(draft.disable).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
