import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices, FAKE_PREVIEW_SECRET, fakeGalleryPhoto } from '../../../__mocks__/cms-services';

import { findGalleryDraftList, findGalleryList } from './index';

import type { CMSServices } from '@napochaan/cms-api/services';

const context = vi.hoisted(() => ({ env: {} as { CMS?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> } } }));

// The adapters read the CMS binding from the per-request context (getCMSClient).
vi.mock('@lib/request-context', () => ({ getRequestContext: () => context }));

const useServices = (overrides: Partial<CMSServices> = {}) => {
  context.env = { CMS: createFakeCMSBinding(createFakeCMSServices(overrides)) };
};

const boom = async (): Promise<never> => {
  throw new Error('boom');
};

beforeEach(() => {
  useServices();
});

describe('gallery adapter', () => {
  it('lists photos with the caption restored to an empty string', async () => {
    expect(await findGalleryList()).toEqual([{ ...fakeGalleryPhoto, caption: '' }]);
  });

  it('returns an empty draft list with the wrong secret', async () => {
    expect(await findGalleryDraftList('wrong')).toEqual([]);
    expect(await findGalleryDraftList(FAKE_PREVIEW_SECRET)).toHaveLength(1);
  });

  it('throws on a 500', async () => {
    useServices({ gallery: { list: boom, draftList: boom } });
    await expect(findGalleryList()).rejects.toThrow(/500/);
    await expect(findGalleryDraftList(FAKE_PREVIEW_SECRET)).rejects.toThrow(/500/);
  });
});
