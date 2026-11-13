import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { notifyDiscord } from './notify-discord';

import type { ContactInput } from './schema';

const env = { DISCORD_WEBHOOK_URL: 'https://discord.example/webhook' } as const;

const baseInput: ContactInput = {
  name: 'なぽちゃん',
  email: 'user@example.com',
  message: 'これは十分に長い本文です。',
};

type DiscordEmbed = {
  title: string;
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
};

type DiscordPayload = {
  embeds: DiscordEmbed[];
};

const parseBody = (call: Parameters<typeof fetch>): DiscordPayload => {
  const [, init] = call;
  const body = init?.body;
  if (typeof body !== 'string') throw new Error('expected a string body');

  return JSON.parse(body) as DiscordPayload;
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('notifyDiscord', () => {
  it('posts an embed to the webhook url with name, email, and message', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await notifyDiscord(baseInput, env);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(env.DISCORD_WEBHOOK_URL);
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');

    const payload = parseBody(fetchMock.mock.calls[0] ?? ([] as unknown as Parameters<typeof fetch>));
    const [embed] = payload.embeds;
    expect(embed).toBeDefined();
    if (embed === undefined) throw new Error('missing embed');

    const fieldValues = embed.fields.map((field) => field.value);
    expect(fieldValues).toContain(baseInput.name);
    expect(fieldValues).toContain(baseInput.email);
    expect(embed.description).toContain(baseInput.message);
  });

  it('truncates the description to 4000 characters', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await notifyDiscord({ ...baseInput, message: 'あ'.repeat(5000) }, env);

    const payload = parseBody(fetchMock.mock.calls[0] ?? ([] as unknown as Parameters<typeof fetch>));
    const [embed] = payload.embeds;
    expect(embed).toBeDefined();
    if (embed === undefined) throw new Error('missing embed');
    expect(embed.description.length).toBeLessThanOrEqual(4000);
  });

  it('resolves without throwing when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(notifyDiscord(baseInput, env)).resolves.toBeUndefined();
  });

  it('resolves without throwing when the response is not ok', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(notifyDiscord(baseInput, env)).resolves.toBeUndefined();
  });
});
