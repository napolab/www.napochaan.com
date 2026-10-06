'use server';

import { isCloudflareAccessUser } from '@napolab/payload-cloudflare-access/access-user';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';
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
const oauthUninitializedMessage = 'OAuth プロバイダが初期化されていません。デプロイ済みの worker 経由でアクセスしてください。';
const accessSessionErrorMessage = 'Cloudflare Access のセッションが見つかりません。ページを再読み込みしてください。';

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
    return { status: 'error', message: oauthUninitializedMessage };
  }

  const outcome = await completeLogin(helpers, email, password, query);
  if ('redirectTo' in outcome) redirect(outcome.redirectTo);

  return outcome;
};

// Cloudflare Access 経由のリクエストから user を取り直す。form に載った user / email は
// 信用せず、毎回 headers の Access JWT(cloudflare-access strategy)から導出する。
// payload.auth は他の strategy(Access 無効時の password セッション = local-jwt など)の user も
// 返すので、`_strategy === 'cloudflare-access'` の user だけを採る。それ以外は session エラー。
// getPayloadClient は loginUser と同じ理由で動的 import。access-user は import を持たない module
// なので静的 import してよい(strategy 本体は jose / payload を引くので、ここからは import しない)。
const resolveAccessUser = async (): Promise<User | undefined> => {
  try {
    const { getPayloadClient } = await import('@lib/payload/client');
    const payload = await getPayloadClient();
    const { user } = await payload.auth({ headers: await headers() });
    if (user === null || !isCloudflareAccessUser(user)) return undefined;

    return user;
  } catch (error) {
    console.error('[oauth] payload auth failed', error);

    return undefined;
  }
};

// redirect() は try の外で呼ぶため、ここでは redirectTo を返すところまでを担う。
const completeAccessAuthorization = async (helpers: OAuthHelpers, query: string): Promise<LoginOutcome> => {
  const user = await resolveAccessUser();
  if (user === undefined) return { status: 'error', message: accessSessionErrorMessage };

  const authorized = await completeAuthRequest(helpers, user, query);
  if (authorized === undefined) return { status: 'error', message: authRequestErrorMessage };

  return authorized;
};

// 承認ボタンだけの action なので、パスワードという CSRF 防御が無い。クロスサイト防御は 2 段:
// Next の Server Actions の Origin/Host 検査と、cloudflare-access strategy の CSRF 検査
// (header 由来・cookie 由来とも、許可リスト外の Origin なら user を解決しない)。
// serverActions.allowedOrigins を広げると前者が弱まるので注意。フレーム埋め込みは
// worker/middleware/frame-guard.ts が塞ぐ。
export const authorizeWithAccess = async (prev: AuthorizeState, formData: FormData): Promise<AuthorizeState> => {
  const query = readField(formData, 'authRequestQuery');

  const { env } = await getCloudflareContext({ async: true });
  const helpers = getOAuthHelpers(env);
  if (helpers === undefined) return { status: 'error', message: oauthUninitializedMessage };

  const outcome = await completeAccessAuthorization(helpers, query);
  if ('redirectTo' in outcome) redirect(outcome.redirectTo);

  return outcome;
};
