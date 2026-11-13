import { describe, expect, it, vi } from 'vitest';

import { handleSubmitContact } from './handle-submit-contact';

const submitContact = vi.hoisted(() => vi.fn(async () => ({ status: 'success' as const })));
const env = vi.hoisted(() => ({ TURNSTILE_SECRET_KEY: 'secret' }));

vi.mock('./submit-contact', () => ({ submitContact }));
vi.mock('@lib/request-context', () => ({ getRequestContext: () => ({ env, ctx: undefined, request: new Request('http://x/') }) }));

describe('handleSubmitContact', () => {
  it('submits with the request-context env and the CF-Connecting-IP header', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost/_actions/submitContact', { method: 'POST', headers: { 'CF-Connecting-IP': '203.0.113.9' } });
    expect(await handleSubmitContact(formData, { request })).toEqual({ status: 'success' });
    expect(submitContact).toHaveBeenCalledWith(formData, env, '203.0.113.9');
  });

  it('passes no remote IP when the header is absent', async () => {
    const formData = new FormData();
    await handleSubmitContact(formData, { request: new Request('http://localhost/_actions/submitContact', { method: 'POST' }) });
    expect(submitContact).toHaveBeenLastCalledWith(formData, env, undefined);
  });
});
