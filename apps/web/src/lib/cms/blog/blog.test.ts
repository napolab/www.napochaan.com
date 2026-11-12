import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices, FAKE_PREVIEW_SECRET, fakePost } from '../../../__mocks__/cms-services';

import { findBlogBySlug, findBlogDraftById, findBlogList } from './index';

import type { CMSServices } from '@napochaan/cms-api/services';

const context = vi.hoisted(() => ({ env: {} as { CMS?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> } } }));

// Only the async context exists outside a request (e.g. `generateStaticParams`
// under `next dev`): the sync form throws, so the adapters must use the async one.
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (options?: { async?: boolean }) => {
    if (options?.async !== true) throw new Error('getCloudflareContext called in sync mode');
    return Promise.resolve(context);
  },
}));

const useServices = (overrides: Partial<CMSServices> = {}) => {
  context.env = { CMS: createFakeCMSBinding(createFakeCMSServices(overrides)) };
};

const failing = (): CMSServices['blog'] => ({
  list: async () => {
    throw new Error('boom');
  },
  bySlug: async () => {
    throw new Error('boom');
  },
  draft: async () => {
    throw new Error('boom');
  },
});

beforeEach(() => {
  useServices();
});

describe('findBlogList', () => {
  it('maps the cms list to posts', async () => {
    expect(await findBlogList()).toEqual([fakePost]);
  });

  it('throws on a 500', async () => {
    useServices({ blog: failing() });
    await expect(findBlogList()).rejects.toThrow(/500/);
  });
});

describe('findBlogBySlug', () => {
  it('returns the post for a known slug', async () => {
    expect(await findBlogBySlug('a')).toEqual(fakePost);
  });

  it('returns undefined on a 404', async () => {
    expect(await findBlogBySlug('nope')).toBeUndefined();
  });

  it('throws on a 500', async () => {
    useServices({ blog: failing() });
    await expect(findBlogBySlug('a')).rejects.toThrow(/500/);
  });
});

describe('path param encoding', () => {
  const recordSlugs = () => {
    const seen: string[] = [];
    const base = createFakeCMSServices().blog;
    useServices({
      blog: {
        ...base,
        bySlug: async (slug) => {
          seen.push(slug);
          return undefined;
        },
        draft: async (id) => {
          seen.push(id);
          return undefined;
        },
      },
    });
    return seen;
  };

  it('sends a slug containing `?` as one path segment', async () => {
    const seen = recordSlugs();
    expect(await findBlogBySlug('a?b')).toBeUndefined();
    expect(seen).toEqual(['a?b']);
  });

  it('keeps `../x` inside the slug route instead of reaching another cms route', async () => {
    const seen = recordSlugs();
    expect(await findBlogBySlug('../x')).toBeUndefined();
    expect(seen).toEqual(['../x']);
  });

  it('sends a draft id containing `/` and `#` as one path segment', async () => {
    const seen = recordSlugs();
    expect(await findBlogDraftById('1/#x', FAKE_PREVIEW_SECRET)).toBeUndefined();
    expect(seen).toEqual(['1/#x']);
  });
});

describe('findBlogDraftById', () => {
  it('returns the draft with the right secret', async () => {
    expect(await findBlogDraftById('1', FAKE_PREVIEW_SECRET)).toEqual(fakePost);
  });

  it('returns undefined on a 403 (wrong secret)', async () => {
    expect(await findBlogDraftById('1', 'wrong')).toBeUndefined();
  });

  it('returns undefined on a 404', async () => {
    expect(await findBlogDraftById('999', FAKE_PREVIEW_SECRET)).toBeUndefined();
  });

  it('throws on a 500', async () => {
    useServices({ blog: failing() });
    await expect(findBlogDraftById('1', FAKE_PREVIEW_SECRET)).rejects.toThrow(/500/);
  });
});
