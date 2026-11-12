import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices, FAKE_PREVIEW_SECRET, fakeLogManualItem } from '../../../__mocks__/cms-services';

import { findLogDraftList, findLogList } from './index';

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

describe('logs adapter', () => {
  it('lists log entries', async () => {
    expect(await findLogList()).toEqual([fakeLogManualItem]);
  });

  it('returns an empty draft list with the wrong secret', async () => {
    expect(await findLogDraftList('wrong')).toEqual([]);
    expect(await findLogDraftList(FAKE_PREVIEW_SECRET)).toEqual([fakeLogManualItem]);
  });

  it('throws on a 500', async () => {
    useServices({ logs: { list: boom, draftList: boom } });
    await expect(findLogList()).rejects.toThrow(/500/);
  });
});
