import { describe, expect, it, vi } from 'vitest';

import { createApp } from './index';

import type { CMSServices, GalleryPhotoDTO, LogManualItemDTO, NewsItemDTO, PostDTO, ProfileDTO, WorkRowDTO } from '../services/index';

const post: PostDTO = { id: '1', slug: 'a', index: '01', title: 'T', readMin: 3, date: '2026-01-01', excerpt: 'e' };
const news: NewsItemDTO = { id: 'n1', slug: 'n', date: '2026-01-01', category: 'c', title: 'N' };
const work: WorkRowDTO = { id: 'w1', slug: 'w', no: '01', title: 'W', type: 'app', year: 2026 };
const photo: GalleryPhotoDTO = { id: 'g1', src: '/g.png', width: 1, height: 1, alt: 'a' };
const log: LogManualItemDTO = { id: 'l1', title: 'L', date: '2026-01-01', meta: 'm' };
const profile: ProfileDTO = { name: 'n', aka: 'a', now: 'x', team: 't', tagline: 'tg', love: ['a'], skillGroups: [], contacts: [] };

const bytes = (): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.close();
    },
  });

const fakeServices = (verify = true) => {
  const services = {
    blog: { list: vi.fn(async () => [post]), bySlug: vi.fn(async (slug: string) => (slug === 'a' ? post : undefined)), draft: vi.fn(async (id: string) => (id === '1' ? post : undefined)) },
    news: {
      list: vi.fn(async () => [news]),
      bySlug: vi.fn(async (slug: string) => (slug === 'n' ? news : undefined)),
      draft: vi.fn(async (id: string) => (id === 'n1' ? news : undefined)),
      latest: vi.fn(async (_limit: number) => [news]),
    },
    works: { list: vi.fn(async () => [work]), bySlug: vi.fn(async (slug: string) => (slug === 'w' ? work : undefined)), draft: vi.fn(async (id: string) => (id === 'w1' ? work : undefined)) },
    gallery: { list: vi.fn(async () => [photo]), draftList: vi.fn(async () => [photo]) },
    logs: { list: vi.fn(async () => [log]), draftList: vi.fn(async () => [log]) },
    profile: { get: vi.fn(async (): Promise<ProfileDTO | undefined> => profile) },
    media: {
      file: vi.fn(async (filename: string) => (filename === 'a.png' ? { body: bytes(), contentType: 'image/png', size: 3, etag: '"e"' } : undefined)),
    },
    preview: { verify: vi.fn((secret: string) => verify && secret === 'right') },
  } satisfies CMSServices;
  return services;
};

const draftHeaders = { 'x-preview-secret': 'right' };

describe('public routes', () => {
  it('GET /blog lists posts', async () => {
    const app = createApp(fakeServices());
    const res = await app.request('/blog');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([post]);
  });

  it('GET /blog/:slug returns 404 when missing and the post when found', async () => {
    const services = fakeServices();
    const app = createApp(services);
    const missing = await app.request('/blog/nope');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'not_found' });
    const found = await app.request('/blog/a');
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual(await services.blog.bySlug('a'));
  });

  it('GET /news/latest passes a validated limit', async () => {
    const services = fakeServices();
    const app = createApp(services);
    const res = await app.request('/news/latest?limit=3');
    expect(res.status).toBe(200);
    expect(services.news.latest).toHaveBeenCalledWith(3);
  });

  it.each(['0', '51', 'x', '1.5', ''])('GET /news/latest?limit=%s is 400', async (limit) => {
    const services = fakeServices();
    const res = await createApp(services).request(`/news/latest?limit=${limit}`);
    expect(res.status).toBe(400);
    expect(services.news.latest).not.toHaveBeenCalled();
  });

  it('GET /news/latest is not shadowed by /news/:slug', async () => {
    const services = fakeServices();
    await createApp(services).request('/news/latest?limit=2');
    expect(services.news.bySlug).not.toHaveBeenCalled();
  });

  it('GET /news and /news/:slug', async () => {
    const app = createApp(fakeServices());
    expect(await (await app.request('/news')).json()).toEqual([news]);
    expect(await (await app.request('/news/n')).json()).toEqual(news);
    expect((await app.request('/news/zz')).status).toBe(404);
  });

  it('GET /works and /works/:slug', async () => {
    const app = createApp(fakeServices());
    expect(await (await app.request('/works')).json()).toEqual([work]);
    expect(await (await app.request('/works/w')).json()).toEqual(work);
    expect((await app.request('/works/zz')).status).toBe(404);
  });

  it('GET /gallery and /logs', async () => {
    const app = createApp(fakeServices());
    expect(await (await app.request('/gallery')).json()).toEqual([photo]);
    expect(await (await app.request('/logs')).json()).toEqual([log]);
  });

  it('GET /profile returns 404 when absent', async () => {
    const services = fakeServices();
    const app = createApp(services);
    expect(await (await app.request('/profile')).json()).toEqual(profile);
    services.profile.get.mockResolvedValueOnce(undefined);
    const res = await app.request('/profile');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});

describe('draft routes', () => {
  it('rejects a wrong secret with 403 and never calls the draft service', async () => {
    const services = fakeServices();
    const res = await createApp(services).request('/drafts/blog/1', { headers: { 'x-preview-secret': 'wrong' } });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
    expect(services.blog.draft).not.toHaveBeenCalled();
  });

  it('rejects a missing header with 400', async () => {
    const services = fakeServices();
    const res = await createApp(services).request('/drafts/blog/1');
    expect(res.status).toBe(400);
    expect(services.preview.verify).not.toHaveBeenCalled();
    expect(services.blog.draft).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown id with a valid secret', async () => {
    const res = await createApp(fakeServices()).request('/drafts/blog/zzz', { headers: draftHeaders });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });

  it('serves blog/news/works drafts', async () => {
    const app = createApp(fakeServices());
    expect(await (await app.request('/drafts/blog/1', { headers: draftHeaders })).json()).toEqual(post);
    expect(await (await app.request('/drafts/news/n1', { headers: draftHeaders })).json()).toEqual(news);
    expect(await (await app.request('/drafts/works/w1', { headers: draftHeaders })).json()).toEqual(work);
  });

  it('serves gallery/logs drafts and guards them', async () => {
    const services = fakeServices();
    const app = createApp(services);
    expect(await (await app.request('/drafts/gallery', { headers: draftHeaders })).json()).toEqual([photo]);
    expect(await (await app.request('/drafts/logs', { headers: draftHeaders })).json()).toEqual([log]);
    const denied = await app.request('/drafts/gallery', { headers: { 'x-preview-secret': 'wrong' } });
    expect(denied.status).toBe(403);
    expect(services.gallery.draftList).toHaveBeenCalledTimes(1);
  });
});

describe('media route', () => {
  it('streams the file with headers', async () => {
    const res = await createApp(fakeServices()).request('/media/a.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Length')).toBe('3');
    expect(res.headers.get('ETag')).toBe('"e"');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('returns 404 when absent', async () => {
    const res = await createApp(fakeServices()).request('/media/none.png');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});
