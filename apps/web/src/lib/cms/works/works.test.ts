import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices, FAKE_PREVIEW_SECRET, fakeWorkRow } from '../../../__mocks__/cms-services';

import { findWorkBySlug, findWorkDraftById, findWorksList } from './index';

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

const boom = async (): Promise<never> => {
  throw new Error('boom');
};

beforeEach(() => {
  useServices();
});

describe('works adapter', () => {
  it('lists works', async () => {
    expect(await findWorksList()).toEqual([fakeWorkRow]);
  });

  it('returns undefined for an unknown slug and the work for a known one', async () => {
    expect(await findWorkBySlug('nope')).toBeUndefined();
    expect(await findWorkBySlug('w')).toEqual(fakeWorkRow);
  });

  it('returns undefined for a draft with the wrong secret', async () => {
    expect(await findWorkDraftById('w1', 'wrong')).toBeUndefined();
    expect(await findWorkDraftById('w1', FAKE_PREVIEW_SECRET)).toEqual(fakeWorkRow);
  });

  it('throws on a 500', async () => {
    useServices({ works: { list: boom, bySlug: boom, draft: boom } });
    await expect(findWorksList()).rejects.toThrow(/500/);
  });
});
