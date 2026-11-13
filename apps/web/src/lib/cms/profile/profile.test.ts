import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices, fakeProfile } from '../../../__mocks__/cms-services';

import { findProfile } from './index';

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

describe('profile adapter', () => {
  it('returns the profile', async () => {
    expect(await findProfile()).toEqual(fakeProfile);
  });

  it('returns undefined on a 404', async () => {
    useServices({ profile: { get: async () => undefined } });
    expect(await findProfile()).toBeUndefined();
  });

  it('throws on a 500', async () => {
    useServices({ profile: { get: boom } });
    await expect(findProfile()).rejects.toThrow(/500/);
  });
});
