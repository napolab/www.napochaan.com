import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { sendContactEmail } from './send-email';

import type { ContactInput } from './schema';

const input: ContactInput = {
  name: 'なぽちゃん',
  email: 'user@example.com',
  message: 'これは十分に長い本文です。よろしくお願いします。',
};

const env = { RESEND_API_KEY: 'test_key', CONTACT_FROM_EMAIL: 'from@example.com', CONTACT_TO_EMAIL: 'to@example.com' } as const;

const RESEND_URL = 'https://api.resend.com/emails';

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendContactEmail', () => {
  it('returns ok and posts the expected request to Resend', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 200 }));

    const result = await sendContactEmail(input, env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(RESEND_URL);
    expect(init?.method).toBe('POST');

    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer test_key');
    expect(headers.get('content-type')).toBe('application/json');

    const body = JSON.parse(`${init?.body}`) as Record<string, unknown>;
    expect(body.from).toBe('from@example.com');
    expect(body.to).toBe('to@example.com');
    expect(body.reply_to).toBe(input.email);
    expect(`${body.subject}`).toContain(input.name);
    expect(`${body.text}`).toContain(input.message);
    expect(`${body.text}`).toContain(input.name);
    expect(`${body.text}`).toContain(input.email);
  });

  it('returns ok:false on a non-2xx response', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(new Response('validation failed', { status: 422 }));

    const result = await sendContactEmail(input, env);

    expect(result.ok).toBe(false);
  });

  it('returns ok:false on a 500 response', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

    const result = await sendContactEmail(input, env);

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when fetch rejects, without throwing', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await sendContactEmail(input, env);

    expect(result).toEqual({ ok: false, error: 'メール送信に失敗しました' });
  });
});
