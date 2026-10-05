import { errAsync, okAsync } from 'neverthrow';
import type { ResultAsync } from 'neverthrow';

import { isAllowedCookieRequest } from '../csrf';
import { CrossSiteCookieRequest, ResolveUserError } from '../errors';
import type { AccessJWTError } from '../errors';
import { createPayloadUserStore, resolveAccessUser } from '../resolve-user';
import type { AccessUser } from '../resolve-user';
import { extractAccessToken } from '../token';
import type { AccessToken } from '../token/types';
import { verifyAccessJWT } from '../verify';

import type { JWTVerifyGetKey } from 'jose';
import type { AuthStrategy, AuthStrategyResult, Payload, TypedUser } from 'payload';

export const ACCESS_STRATEGY_NAME = 'cloudflare-access';

export type AccessStrategyOptions = {
  teamDomain: string;
  aud: readonly string[];
  // Payload の結果型 (`AuthStrategyResult['user']`) は `TypedUser['collection']` を要求するので、それに合わせる。
  collection: TypedUser['collection'];
  keys: JWTVerifyGetKey;
};

export type AuthenticatePayload = Pick<Payload, 'find' | 'create' | 'config' | 'logger'>;

type AuthenticateArgs = { headers: Headers; payload: AuthenticatePayload };

type AccessFailure = CrossSiteCookieRequest | AccessJWTError | ResolveUserError;

const noUser = (): AuthStrategyResult => ({ user: null });

// Cookie は同一サイトの XHR / 遷移でしか受け付けない(ブラウザが自動で付けるので CSRF 対策が要る)。header は対象外。
const requireSafeOrigin = (accessToken: AccessToken, args: AuthenticateArgs): ResultAsync<AccessToken, CrossSiteCookieRequest> => {
  if (accessToken.source === 'header') return okAsync(accessToken);
  if (isAllowedCookieRequest(args.headers, args.payload.config.csrf)) return okAsync(accessToken);

  return errAsync(new CrossSiteCookieRequest());
};

const authenticateToken = (options: AccessStrategyOptions, args: AuthenticateArgs, accessToken: AccessToken): ResultAsync<AccessUser, AccessFailure> =>
  requireSafeOrigin(accessToken, args)
    .andThen(({ token }) => verifyAccessJWT({ token, teamDomain: options.teamDomain, aud: options.aud, keys: options.keys }))
    .andThen((identity) => resolveAccessUser(createPayloadUserStore(args.payload, options.collection), identity));

// 失敗は拒否(token/csrf/verify)と運用障害(resolve)で重大度を分ける。strategy 自体は投げない。
const logFailure = (logger: AuthenticatePayload['logger'], source: AccessToken['source'], failure: AccessFailure): void => {
  if (failure instanceof ResolveUserError) {
    logger.error({ err: failure, source }, 'Cloudflare Access user resolution failed');
    return;
  }
  logger.warn({ err: failure, source }, 'Cloudflare Access authentication rejected');
};

export const authenticateAccess = async (options: AccessStrategyOptions, args: AuthenticateArgs): Promise<AuthStrategyResult> =>
  extractAccessToken(args.headers).match(
    (accessToken) =>
      authenticateToken(options, args, accessToken).match(
        (user): AuthStrategyResult => ({ user: { ...user, collection: options.collection, _strategy: ACCESS_STRATEGY_NAME } }),
        (failure): AuthStrategyResult => {
          logFailure(args.payload.logger, accessToken.source, failure);
          return noUser();
        },
      ),
    async () => noUser(),
  );

export const createAccessStrategy = (options: AccessStrategyOptions): AuthStrategy => ({
  name: ACCESS_STRATEGY_NAME,
  authenticate: (args) => authenticateAccess(options, args),
});
