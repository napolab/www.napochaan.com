'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { redirect } from 'next/navigation';

import { getOAuthHelpers } from '@lib/mcp/oauth';
import { absoluteUrl } from '@utils/site-url';

import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

export type AuthorizeState = {
  status: 'idle' | 'error';
  message?: string;
};

export const initialAuthorizeState: AuthorizeState = { status: 'idle' };

const readField = (fd: FormData, key: string): string => {
  const value = fd.get(key);

  return typeof value === 'string' ? value : '';
};

type LoginOutcome = { redirectTo: string } | AuthorizeState;

// redirect() は throw で制御するため try の外で呼ぶ必要がある。
// ここでは redirectTo を返すところまでを担い、throw しない。
//
// getPayloadClient は動的 import する: 'use server' ファイルがこれを静的 import
// すると payload.config の top-level await が browser-mode vitest のビルドに
// 巻き込まれ、この action を import する client component (AuthorizeForm) の
// テストが "Failed to fetch dynamically imported module" で壊れる。
const completeLogin = async (helpers: OAuthHelpers, email: string, password: string, query: string): Promise<LoginOutcome> => {
  try {
    const { getPayloadClient } = await import('@lib/payload/client');
    const payload = await getPayloadClient();
    const { user } = await payload.login({ collection: 'users', data: { email, password } });
    if (user === undefined) return { status: 'error', message: 'ログインに失敗しました。' };

    const authRequest = await helpers.parseAuthRequest(new Request(absoluteUrl(`/oauth/authorize?${query}`)));
    const { redirectTo } = await helpers.completeAuthorization({
      request: authRequest,
      userId: `${user.id}`,
      metadata: { via: 'mcp-blog-authorize' },
      scope: authRequest.scope,
      props: { userID: user.id, email: user.email },
    });

    return { redirectTo };
  } catch (error) {
    console.error('[oauth] authorize failed', error);

    return { status: 'error', message: 'メールアドレスまたはパスワードが正しくありません。' };
  }
};

export const authorize = async (prev: AuthorizeState, formData: FormData): Promise<AuthorizeState> => {
  const email = readField(formData, 'email');
  const password = readField(formData, 'password');
  const query = readField(formData, 'authRequestQuery');

  const { env } = await getCloudflareContext({ async: true });
  const helpers = getOAuthHelpers(env);
  if (helpers === undefined) {
    return { status: 'error', message: 'OAuth プロバイダが初期化されていません。デプロイ済みの worker 経由でアクセスしてください。' };
  }

  const outcome = await completeLogin(helpers, email, password, query);
  if ('redirectTo' in outcome) redirect(outcome.redirectTo);

  return outcome;
};
