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

  it('wires media to env.R2', async () => {
    const get = vi.fn(async () => null);
    const wired = { R2: { get }, PREVIEW_SECRET: 's' } as unknown as CloudflareEnv;

    expect(await createPayloadServices(wired, ctx).media.file('a.png')).toBeUndefined();
    expect(get).toHaveBeenCalledWith('a.png');
  });

  it('wires preview to env.PREVIEW_SECRET', () => {
    const wired = { PREVIEW_SECRET: 's' } as unknown as CloudflareEnv;

    expect(createPayloadServices(wired, ctx).preview.verify('s')).toBe(true);
    expect(createPayloadServices(wired, ctx).preview.verify('x')).toBe(false);
  });
});
