import { createApp } from '@napochaan/cms-api/app';

import type { CMSServices, GalleryPhotoDTO, LogManualItemDTO, NewsItemDTO, PostDTO, ProfileDTO, WorkRowDTO } from '@napochaan/cms-api/services';

// In-memory `CMSServices` for tests. Lookups match by slug / id against the
// fixtures; `preview.verify` accepts only FAKE_PREVIEW_SECRET.
export const FAKE_PREVIEW_SECRET = 'right';

export const fakePost: PostDTO = { id: '1', slug: 'a', index: '01', title: 'Post A', readMin: 3, date: '2026-01-01', excerpt: 'e' };
export const fakeNewsItem: NewsItemDTO = { id: 'n1', slug: 'n', date: '2026-01-01', category: 'c', title: 'News N' };
export const fakeWorkRow: WorkRowDTO = { id: 'w1', slug: 'w', no: '01', title: 'Work W', type: 'app', year: 2026 };
export const fakeGalleryPhoto: GalleryPhotoDTO = { id: 'g1', src: '/g.png', width: 4, height: 3, alt: 'a' };
export const fakeLogManualItem: LogManualItemDTO = { id: 'l1', title: 'Log L', date: '2026-01-01', meta: 'm' };
export const fakeProfile: ProfileDTO = { name: 'naporitan', aka: 'napochaan', now: 'x', team: 't', tagline: 'tg', love: [], skillGroups: [], contacts: [] };

export const createFakeCMSServices = (overrides: Partial<CMSServices> = {}): CMSServices => ({
  blog: {
    list: async () => [fakePost],
    bySlug: async (slug) => (slug === fakePost.slug ? fakePost : undefined),
    draft: async (id) => (id === fakePost.id ? fakePost : undefined),
  },
  news: {
    list: async () => [fakeNewsItem],
    latest: async (limit) => [fakeNewsItem].slice(0, limit),
    bySlug: async (slug) => (slug === fakeNewsItem.slug ? fakeNewsItem : undefined),
    draft: async (id) => (id === fakeNewsItem.id ? fakeNewsItem : undefined),
  },
  works: {
    list: async () => [fakeWorkRow],
    bySlug: async (slug) => (slug === fakeWorkRow.slug ? fakeWorkRow : undefined),
    draft: async (id) => (id === fakeWorkRow.id ? fakeWorkRow : undefined),
  },
  gallery: { list: async () => [fakeGalleryPhoto], draftList: async () => [fakeGalleryPhoto] },
  logs: { list: async () => [fakeLogManualItem], draftList: async () => [fakeLogManualItem] },
  profile: { get: async () => fakeProfile },
  media: { file: async () => undefined },
  preview: { verify: (secret) => secret === FAKE_PREVIEW_SECRET },
  ...overrides,
});

// A stand-in for the `CMS` Service Binding: `hc` calls `fetch(url, init)`, which
// Hono's `app.request` accepts (unlike `app.fetch(request, env, ctx)`).
export const createFakeCMSBinding = (services: CMSServices = createFakeCMSServices()) => {
  const app = createApp(services);

  return { fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => app.request(input, init) };
};
