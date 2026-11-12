import { verifyAccessJWT } from '@napolab/cloudflare-access-core/verify';
import { err, errAsync, ok, okAsync, ResultAsync } from 'neverthrow';

import { MCPUserNotFound, MissingAccessAssertion } from '../errors';

import type { AccessJWTError } from '@napolab/cloudflare-access-core/errors';
import type { AccessUser } from '@napolab/payload-cloudflare-access/resolve-user';
import type { AccessIdentity } from '@napolab/cloudflare-access-core/verify';
import type { JWTVerifyGetKey } from 'jose';
import type { Result } from 'neverthrow';

// Cloudflare Access が origin へ転送するリクエストに付ける、署名済み JWT の header。
export const ACCESS_ASSERTION_HEADER = 'Cf-Access-Jwt-Assertion';

// aud は MCP 用 Access アプリの AUD だけ(CF_ACCESS_MCP_AUD)。admin 用の CF_ACCESS_AUD は混ぜない。
export type MCPAccessConfig = { teamDomain: string; aud: readonly string[]; keys: JWTVerifyGetKey };

// MCP からは user を作らない。既存 user を引くだけ。
export type FindUserByEmail = (email: string) => Promise<AccessUser | undefined>;

export type MCPAuthError = MissingAccessAssertion | AccessJWTError | MCPUserNotFound;

const readAssertion = (headers: Headers): Result<string, MissingAccessAssertion> => {
  const token = headers.get(ACCESS_ASSERTION_HEADER);
  if (token === null || token === '') return err(new MissingAccessAssertion());
  return ok(token);
};

const verifyAssertion =
  (config: MCPAccessConfig) =>
  (token: string): ResultAsync<AccessIdentity, AccessJWTError> =>
    verifyAccessJWT({ token, teamDomain: config.teamDomain, aud: config.aud, keys: config.keys });

// admin 側の resolveAccessUser と同じく小文字で引く(Access の email は大小文字が揺れうる)。前後の空白も落とす。
const normalizeEmail = (identity: AccessIdentity): string => identity.email.trim().toLowerCase();

// user 不在だけを認証失敗(MCPUserNotFound)にする。store の例外(D1 障害など)は認証失敗ではないので
// Result に折り込まず reject のまま返し、route 側で 500 にさせる(403 に化けさせない)。
const findUser =
  (findUserByEmail: FindUserByEmail) =>
  (email: string): ResultAsync<AccessUser, MCPUserNotFound> => {
    if (email === '') return errAsync(new MCPUserNotFound());
    return ResultAsync.fromSafePromise(findUserByEmail(email)).andThen((user) => (user === undefined ? errAsync(new MCPUserNotFound()) : okAsync(user)));
  };

export const authenticateMCPRequest = (headers: Headers, config: MCPAccessConfig, findUserByEmail: FindUserByEmail): ResultAsync<AccessUser, MCPAuthError> =>
  readAssertion(headers).asyncAndThen(verifyAssertion(config)).map(normalizeEmail).andThen(findUser(findUserByEmail));
