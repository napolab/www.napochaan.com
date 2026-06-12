import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { verifyTurnstile } from './verify-turnstile';

const env = { TURNSTILE_SECRET_KEY: 'test_secret' } as const;

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('verifyTurnstile', () => {
  it('returns true when Cloudflare reports success', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    const result = await verifyTurnstile('valid-token', env);

    expect(result).toBe(true);
  });

  it('posts the secret and response token to the siteverify endpoint', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    await verifyTurnstile('valid-token', env);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe('POST');

    const body = init?.body as FormData;
    expect(body.get('secret')).toBe('test_secret');
    expect(body.get('response')).toBe('valid-token');
  });

  it('appends the remote IP when provided', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    await verifyTurnstile('valid-token', env, '203.0.113.7');

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const body = init?.body as FormData;
    expect(body.get('remoteip')).toBe('203.0.113.7');
  });

  it('returns false when Cloudflare reports failure', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }));

    const result = await verifyTurnstile('bad-token', env);

    expect(result).toBe(false);
  });

  it('returns false without calling fetch when the token is empty', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    const result = await verifyTurnstile('', env);

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns false when the endpoint responds with a non-OK status', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));

    const result = await verifyTurnstile('valid-token', env);

    expect(result).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await verifyTurnstile('valid-token', env);

    expect(result).toBe(false);
  });
});
