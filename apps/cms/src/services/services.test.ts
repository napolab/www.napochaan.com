import { describe, expect, it, vi } from 'vitest';

import { createPayloadServices } from './index';

// `withPayload` imports `.open-next/cloudflare/init.js`, which only exists after an
// OpenNext build, so the composition root is tested with it replaced.
vi.mock('../rpc/local-payload/index', () => ({ withPayload: vi.fn() }));

const env = {} as CloudflareEnv;
const ctx = {} as ExecutionContext;

describe('createPayloadServices', () => {
  it('wires every CMSServices member', () => {
    const services = createPayloadServices(env, ctx);

    expect(Object.keys(services).toSorted()).toEqual(['blog', 'gallery', 'logs', 'media', 'news', 'preview', 'profile', 'works']);
  });

  it('stubs media.file to undefined until Task 5', async () => {
    expect(await createPayloadServices(env, ctx).media.file('a.png')).toBeUndefined();
  });

  it('stubs preview.verify to false until Task 5', () => {
    expect(createPayloadServices(env, ctx).preview.verify('secret')).toBe(false);
  });
});
