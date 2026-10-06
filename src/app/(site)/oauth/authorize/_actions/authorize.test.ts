import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { authorizeWithAccess } from './authorize';

const requestHeaders = new Headers({ 'cf-access-jwt-assertion': 'token' });
const redirectTarget = 'https://client.example/cb';

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  parseAuthRequest: vi.fn(),
  completeAuthorization: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: async () => ({ env: {} }) }));
vi.mock('@lib/mcp/oauth', () => ({
  getOAuthHelpers: () => ({ parseAuthRequest: mocks.parseAuthRequest, completeAuthorization: mocks.completeAuthorization }),
}));
vi.mock('@lib/payload/client', () => ({ getPayloadClient: async () => ({ auth: mocks.auth }) }));

const sessionError = { status: 'error', message: 'Cloudflare Access のセッションが見つかりません。ページを再読み込みしてください。' };

const buildForm = (fields: Record<string, string>): FormData => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);

  return formData;
};

describe('authorizeWithAccess', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BASE_URL', 'https://www.example.test');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.parseAuthRequest.mockResolvedValue({ clientId: 'client-1', scope: ['mcp'] });
    mocks.completeAuthorization.mockResolvedValue({ redirectTo: redirectTarget });
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
  });

  test('derives the user from request headers, not form fields', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 7, email: 'napo@example.com', _strategy: 'cloudflare-access' } });
    const formData = buildForm({ authRequestQuery: 'client_id=client-1', email: 'attacker@example.com', userId: '999' });

    await expect(authorizeWithAccess({ status: 'idle' }, formData)).rejects.toThrow(RedirectSignal);

    expect(mocks.auth).toHaveBeenCalledWith({ headers: requestHeaders });
    expect(mocks.completeAuthorization).toHaveBeenCalledTimes(1);
    expect(mocks.completeAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '7',
        props: { userID: 7, email: 'napo@example.com' },
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith(redirectTarget);
  });

  test('returns the session error when no user', async () => {
    mocks.auth.mockResolvedValue({ user: null });

    const state = await authorizeWithAccess({ status: 'idle' }, buildForm({ authRequestQuery: 'client_id=client-1' }));

    expect(state).toEqual(sessionError);
    expect(mocks.completeAuthorization).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  // Access の plugin が無効な環境では payload.auth が password セッション(local-jwt)の user を返す。
  // 承認ボタンだけの同意を通すのは Cloudflare Access strategy で認証された user に限る。
  test('returns the session error for a user from another strategy (local-jwt)', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 7, email: 'napo@example.com', _strategy: 'local-jwt' } });

    const state = await authorizeWithAccess({ status: 'idle' }, buildForm({ authRequestQuery: 'client_id=client-1' }));

    expect(state).toEqual(sessionError);
    expect(mocks.completeAuthorization).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  test('returns the session error when auth throws', async () => {
    mocks.auth.mockRejectedValue(new Error('d1 down'));

    const state = await authorizeWithAccess({ status: 'idle' }, buildForm({ authRequestQuery: 'client_id=client-1' }));

    expect(state).toEqual(sessionError);
    expect(mocks.completeAuthorization).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
