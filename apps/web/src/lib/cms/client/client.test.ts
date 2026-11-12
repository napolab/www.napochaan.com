import { describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding } from '../../../__mocks__/cms-services';

import { getCMSClient } from './index';

const context = vi.hoisted(() => ({ env: {} as { CMS?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> } } }));

// Outside a request (`generateStaticParams` under `next dev`) the sync form
// throws ("called without having called initOpenNextCloudflareForDev"); only
// the async form resolves.
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (options?: { async?: boolean }) => {
    if (options?.async !== true) throw new Error('getCloudflareContext called in sync mode');
    return Promise.resolve(context);
  },
}));

describe('getCMSClient', () => {
  it('builds a client from the async Cloudflare context', async () => {
    context.env = { CMS: createFakeCMSBinding() };
    const cms = await getCMSClient();
    const res = await cms.blog.$get();
    expect(res.status).toBe(200);
  });

  it('rejects with a clear error when the CMS binding is missing', async () => {
    context.env = {};
    await expect(getCMSClient()).rejects.toThrow(/CMS service binding is not configured/);
  });
});
