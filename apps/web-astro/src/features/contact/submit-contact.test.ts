import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitContact } from './submit-contact';

import type { ContactEnv } from './submit-contact';

const verifyTurnstile = vi.hoisted(() => vi.fn<(token: string, env: unknown, remoteIP?: string) => Promise<boolean>>());
const sendContactEmail = vi.hoisted(() => vi.fn<(input: unknown, env: unknown) => Promise<{ ok: true } | { ok: false; error: string }>>());
const notifyDiscord = vi.hoisted(() => vi.fn<(input: unknown, env: unknown) => Promise<void>>());

vi.mock('@lib/contact/verify-turnstile', () => ({ verifyTurnstile }));
vi.mock('@lib/contact/send-email', () => ({ sendContactEmail }));
vi.mock('@lib/contact/notify-discord', () => ({ notifyDiscord }));

const env: ContactEnv = {
  TURNSTILE_SECRET_KEY: 'secret',
  RESEND_API_KEY: 're_test',
  CONTACT_FROM_EMAIL: 'from@example.com',
  CONTACT_TO_EMAIL: 'to@example.com',
  DISCORD_WEBHOOK_URL: 'https://discord.example/webhook',
};

const formOf = (fields: Record<string, string>): FormData => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.append(key, value);

  return formData;
};

const valid = { name: 'napochaan', email: 'napo@example.com', message: 'これはテスト用の本文です。', 'cf-turnstile-response': 'token' };

beforeEach(() => {
  verifyTurnstile.mockReset().mockResolvedValue(true);
  sendContactEmail.mockReset().mockResolvedValue({ ok: true });
  notifyDiscord.mockReset().mockResolvedValue(undefined);
});

describe('submitContact', () => {
  it('verifies the Turnstile token with the remote IP before anything else', async () => {
    await submitContact(formOf(valid), env, '203.0.113.1');
    expect(verifyTurnstile).toHaveBeenCalledWith('token', env, '203.0.113.1');
  });

  it('fails without sending when Turnstile verification fails', async () => {
    verifyTurnstile.mockResolvedValue(false);
    const state = await submitContact(formOf(valid), env, undefined);
    expect(state).toEqual({
      status: 'error',
      message: '認証を確認できませんでした。もう一度お試しください。',
      values: { name: 'napochaan', email: 'napo@example.com', message: 'これはテスト用の本文です。' },
    });
    expect(sendContactEmail).not.toHaveBeenCalled();
    expect(notifyDiscord).not.toHaveBeenCalled();
  });

  it('treats a missing token as an empty one (verifyTurnstile rejects it)', async () => {
    const { 'cf-turnstile-response': _token, ...withoutToken } = valid;
    await submitContact(formOf(withoutToken), env, undefined);
    expect(verifyTurnstile).toHaveBeenCalledWith('', env, undefined);
  });

  it('rejects invalid input with per-field errors and the submitted values', async () => {
    const state = await submitContact(formOf({ ...valid, email: 'nope', message: '短い' }), env, undefined);
    expect(state.status).toBe('error');
    expect(state.message).toBe('入力内容を確認してください');
    expect(state.fieldErrors).toEqual({ email: ['正しいメールアドレスを入力してください'], message: ['本文は10文字以上で入力してください'] });
    expect(state.values).toEqual({ name: 'napochaan', email: 'nope', message: '短い' });
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('fails gracefully without calling Resend when RESEND_API_KEY is unset', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const state = await submitContact(formOf(valid), { ...env, RESEND_API_KEY: '' }, undefined);
    expect(state.status).toBe('error');
    expect(state.message).toBe('送信に失敗しました。しばらくして再度お試しください。');
    expect(sendContactEmail).not.toHaveBeenCalled();
    expect(notifyDiscord).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('fails without notifying Discord when the email send fails', async () => {
    sendContactEmail.mockResolvedValue({ ok: false, error: 'x' });
    const state = await submitContact(formOf(valid), env, undefined);
    expect(state.status).toBe('error');
    expect(state.message).toBe('送信に失敗しました。しばらくして再度お試しください。');
    expect(notifyDiscord).not.toHaveBeenCalled();
  });

  it('sends the email and notifies Discord once each with the parsed input on success', async () => {
    const state = await submitContact(formOf({ ...valid, name: '  napochaan  ' }), env, undefined);
    expect(state).toEqual({ status: 'success' });
    const parsed = { name: 'napochaan', email: 'napo@example.com', message: 'これはテスト用の本文です。' };
    expect(sendContactEmail).toHaveBeenCalledTimes(1);
    expect(sendContactEmail).toHaveBeenCalledWith(parsed, env);
    expect(notifyDiscord).toHaveBeenCalledTimes(1);
    expect(notifyDiscord).toHaveBeenCalledWith(parsed, env);
  });
});
