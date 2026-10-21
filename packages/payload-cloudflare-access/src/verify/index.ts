import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload, JWTVerifyGetKey } from 'jose';
import { err, ok, ResultAsync } from 'neverthrow';
import type { Result } from 'neverthrow';

import { InvalidAccessToken, MissingAccessEmail, WrongAccessTokenType } from '../errors';
import type { AccessJWTError } from '../errors';

export type AccessIdentity = { email: string };

export type VerifyAccessJWTArgs = {
  token: string;
  teamDomain: string;
  aud: readonly string[];
  keys: JWTVerifyGetKey;
};

// @hono/cloudflare-access と同じ許容値(秒)。
const CLOCK_TOLERANCE_SECONDS = 30;

export const accessIssuer = (teamDomain: string): string => `https://${teamDomain}.cloudflareaccess.com`;

// jose の remote JWKS は自前でキャッシュする。呼び出し側が 1 回だけ作って使い回すこと。
export const createAccessKeys = (teamDomain: string): JWTVerifyGetKey => createRemoteJWKSet(new URL('/cdn-cgi/access/certs', accessIssuer(teamDomain)));

const toIdentity = (payload: JWTPayload): Result<AccessIdentity, AccessJWTError> => {
  if (payload['type'] !== 'app') return err(new WrongAccessTokenType(payload['type']));

  const email = payload['email'];
  if (typeof email !== 'string' || email === '') return err(new MissingAccessEmail());

  return ok({ email });
};

export const verifyAccessJWT = ({ token, teamDomain, aud, keys }: VerifyAccessJWTArgs): ResultAsync<AccessIdentity, AccessJWTError> =>
  ResultAsync.fromPromise(
    jwtVerify(token, keys, {
      algorithms: ['RS256'],
      issuer: accessIssuer(teamDomain),
      audience: [...aud],
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    }),
    (cause) => new InvalidAccessToken(cause),
  ).andThen(({ payload }) => toIdentity(payload));
