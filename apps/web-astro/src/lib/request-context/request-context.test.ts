import { describe, expect, it } from 'vitest';

import { getRequestContext, runWithRequestContext } from './index';

import type { RequestContext } from './index';

const makeContext = (): RequestContext => ({
  env: { BASE_URL: 'http://localhost' } as unknown as Cloudflare.Env,
  ctx: undefined,
  request: new Request('http://localhost/'),
});

describe('request context', () => {
  it('returns the context inside runWithRequestContext', () => {
    const context = makeContext();
    expect(runWithRequestContext(context, () => getRequestContext())).toBe(context);
  });

  it('throws outside a request', () => {
    expect(() => getRequestContext()).toThrow(new Error('request context is not available outside a request'));
  });

  it('keeps the context across awaits', async () => {
    const context = makeContext();
    const seen = await runWithRequestContext(context, async () => {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return getRequestContext();
    });
    expect(seen).toBe(context);
  });

  it('isolates concurrent requests', async () => {
    const a = makeContext();
    const b = makeContext();
    const read = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return getRequestContext();
    };
    const [seenA, seenB] = await Promise.all([runWithRequestContext(a, read), runWithRequestContext(b, read)]);
    expect(seenA).toBe(a);
    expect(seenB).toBe(b);
  });
});
