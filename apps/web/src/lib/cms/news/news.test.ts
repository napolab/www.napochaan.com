import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices, FAKE_PREVIEW_SECRET, fakeNewsItem } from '../../../__mocks__/cms-services';

import { findLatestNews, findNewsBySlug, findNewsDraftById, findNewsList } from './index';

import type { CMSServices } from '@napochaan/cms-api/services';

const context = vi.hoisted(() => ({ env: {} as { CMS?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> } } }));

vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => context }));

const useServices = (overrides: Partial<CMSServices> = {}) => {
  context.env = { CMS: createFakeCMSBinding(createFakeCMSServices(overrides)) };
};

const boom = async (): Promise<never> => {
  throw new Error('boom');
};

beforeEach(() => {
  useServices();
});

describe('news adapter', () => {
  it('lists news', async () => {
    expect(await findNewsList()).toEqual([fakeNewsItem]);
  });

  it('passes the latest limit through', async () => {
    const latest = vi.fn(async (_limit: number) => [fakeNewsItem]);
    useServices({ news: { ...createFakeCMSServices().news, latest } });
    expect(await findLatestNews(5)).toEqual([fakeNewsItem]);
    expect(latest).toHaveBeenCalledWith(5);
  });

  it('returns undefined for an unknown slug and the item for a known one', async () => {
    expect(await findNewsBySlug('nope')).toBeUndefined();
    expect(await findNewsBySlug('n')).toEqual(fakeNewsItem);
  });

  it('looks up a news item slugged `latest` through the slug route', async () => {
    const bySlug = vi.fn(async (_slug: string) => undefined);
    useServices({ news: { ...createFakeCMSServices().news, bySlug } });
    expect(await findNewsBySlug('latest')).toBeUndefined();
    expect(bySlug).toHaveBeenCalledWith('latest');
  });

  it('returns undefined for a draft with the wrong secret', async () => {
    expect(await findNewsDraftById('n1', 'wrong')).toBeUndefined();
    expect(await findNewsDraftById('n1', FAKE_PREVIEW_SECRET)).toEqual(fakeNewsItem);
  });

  it('throws on a 500', async () => {
    useServices({ news: { list: boom, latest: boom, bySlug: boom, draft: boom } });
    await expect(findNewsList()).rejects.toThrow(/500/);
    await expect(findLatestNews(5)).rejects.toThrow(/500/);
  });
});
