'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { redirect } from 'next/navigation';

import { getOAuthHelpers } from '@lib/mcp/oauth';
import { absoluteUrl } from '@utils/site-url';

import type { AuthorizeState } from './state';
import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { User } from '@payload-types';

const readField = (fd: FormData, key: string): string => {
  const value = fd.get(key);

  return typeof value === 'string' ? value : '';
};

const credentialErrorMessage = 'メールアドレスまたはパスワードが正しくありません。';
const authRequestErrorMessage = '認可リクエストの処理に失敗しました。MCP クライアントから接続をやり直してください。';

type LoginOutcome = { redirectTo: string } | AuthorizeState;

// getPayloadClient は動的 import する: 'use server' ファイルがこれを静的 import
// すると payload.config の top-level await が browser-mode vitest のビルドに
// 巻き込まれ、この action を import する client component (AuthorizeForm) の
// テストが "Failed to fetch dynamically imported module" で壊れる。
//
// Payload の認証失敗(AuthenticationError)だけをここで吸収する。ここでの throw は
// 「資格情報が誤り」を意味するので、専用のメッセージを返す。
const loginUser = async (email: string, password: string): Promise<User | undefined> => {
  try {
    const { getPayloadClient } = await import('@lib/payload/client');
    const payload = await getPayloadClient();
    const { user } = await payload.login({ collection: 'users', data: { email, password } });

    return user;
  } catch (error) {
    console.error('[oauth] payload login failed', error);

    return undefined;
  }
};

// parseAuthRequest / completeAuthorization の失敗は資格情報とは無関係(不正な
// client_id、redirect_uri 不一致など)。ここでの throw をログイン失敗と混同しない
// ように、別メッセージで返す。
const completeAuthRequest = async (helpers: OAuthHelpers, user: User, query: string): Promise<{ redirectTo: string } | undefined> => {
  try {
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
    console.error('[oauth] authorize request failed', error);

    return undefined;
  }
};

// redirect() は throw で制御するため try の外で呼ぶ必要がある。
// ここでは redirectTo を返すところまでを担い、throw しない。
const completeLogin = async (helpers: OAuthHelpers, email: string, password: string, query: string): Promise<LoginOutcome> => {
  const user = await loginUser(email, password);
  if (user === undefined) return { status: 'error', message: credentialErrorMessage };

  const authorized = await completeAuthRequest(helpers, user, query);
  if (authorized === undefined) return { status: 'error', message: authRequestErrorMessage };

  return authorized;
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
