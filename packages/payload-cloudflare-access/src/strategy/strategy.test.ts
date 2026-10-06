import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import type { JWK, JWTVerifyGetKey, KeyObject } from 'jose';
import { beforeAll, describe, expect, test, vi } from 'vitest';

import { ACCESS_STRATEGY_NAME } from '../access-user';
import { CrossSiteAccessRequest } from '../errors';
import { accessIssuer } from '../verify';
import { authenticateAccess, createAccessStrategy } from './index';
import type { AccessStrategyOptions, AuthenticatePayload } from './index';

const TEAM = 'napolab';
const KID = 'test-key';
const EMAIL = 'napo@example.com';
const NOW_SECONDS = () => Math.floor(Date.now() / 1000);
const CSRF = ['https://napochaan.com'];

type Fixture = { privateKey: CryptoKey | KeyObject; keys: JWTVerifyGetKey };

const createFixture = async (): Promise<Fixture> => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: KID, alg: 'RS256' };
  return { privateKey, keys: createLocalJWKSet({ keys: [jwk] }) };
};

const storedUser = { id: 1, email: EMAIL, updatedAt: '2026-10-05T00:00:00.000Z', createdAt: '2026-10-05T00:00:00.000Z' };

type TestPayload = AuthenticatePayload & {
  find: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  logger: { warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
};

// find / create / logger は Pick<Payload, ...> のうち strategy が触る分だけの最小実装。
const createPayload = (find: () => Promise<unknown> = async () => ({ docs: [storedUser] })): TestPayload => {
  const payload = {
    find: vi.fn(find),
    create: vi.fn(async () => storedUser),
    config: { csrf: CSRF },
    logger: { warn: vi.fn(), error: vi.fn() },
  };
  return payload as unknown as TestPayload;
};

describe('authenticateAccess', () => {
  const fixture: { current?: Fixture } = {};

  beforeAll(async () => {
    fixture.current = await createFixture();
  });

  const getFixture = (): Fixture => {
    if (fixture.current === undefined) throw new Error('fixture is not ready');
    return fixture.current;
  };

  const sign = async (audience = 'aud-1'): Promise<string> =>
    new SignJWT({ type: 'app', email: EMAIL })
      .setProtectedHeader({ alg: 'RS256', kid: KID })
      .setIssuer(accessIssuer(TEAM))
      .setAudience(audience)
      .setExpirationTime(NOW_SECONDS() + 300)
      .setNotBefore(NOW_SECONDS() - 10)
      .sign(getFixture().privateKey);

  const optionsWith = (keys: JWTVerifyGetKey = getFixture().keys): AccessStrategyOptions => ({ teamDomain: TEAM, aud: ['aud-1'], collection: 'users', keys });

  test('does not resolve keys without a token', async () => {
    const keys = vi.fn<JWTVerifyGetKey>(() => {
      throw new Error('keys must not be resolved without a token');
    });

    const result = await authenticateAccess(optionsWith(keys), { headers: new Headers(), payload: createPayload() });

    expect(result).toEqual({ user: null });
    expect(keys).not.toHaveBeenCalled();
  });

  test('authenticates via the header', async () => {
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': await sign() });

    const result = await authenticateAccess(optionsWith(), { headers, payload: createPayload() });

    expect(result.user?.email).toBe(EMAIL);
    expect(result.user?.collection).toBe('users');
    expect(result.user?._strategy).toBe('cloudflare-access');
  });

  test('authenticates via the cookie from the same origin', async () => {
    const headers = new Headers({ cookie: `CF_Authorization=${await sign()}`, 'Sec-Fetch-Site': 'same-origin' });

    const result = await authenticateAccess(optionsWith(), { headers, payload: createPayload() });

    expect(result.user?.email).toBe(EMAIL);
  });

  test('rejects cross-site cookie request', async () => {
    const keys = vi.fn<JWTVerifyGetKey>(() => {
      throw new Error('keys must not be resolved for a rejected cookie request');
    });
    const payload = createPayload();
    const headers = new Headers({ cookie: `CF_Authorization=${await sign()}`, Origin: 'https://evil.example' });

    const result = await authenticateAccess(optionsWith(keys), { headers, payload });

    expect(result).toEqual({ user: null });
    expect(payload.logger.warn).toHaveBeenCalledTimes(1);
    expect(payload.logger.warn).toHaveBeenCalledWith({ err: expect.any(CrossSiteAccessRequest), source: 'cookie' }, 'Cloudflare Access authentication rejected');
    expect(keys).not.toHaveBeenCalled();
  });

  // Access は header をブラウザの CF_Authorization cookie から付けるので、header 由来でもクロスサイト要求を拒否する。
  test.each<{ name: string; metadata: Record<string, string> }>([
    { name: 'a cross-site Origin', metadata: { Origin: 'https://evil.example' } },
    { name: 'a cross-site <img> subresource', metadata: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'image' } },
  ])('rejects a header token on $name without resolving keys', async ({ metadata }) => {
    const keys = vi.fn<JWTVerifyGetKey>(() => {
      throw new Error('keys must not be resolved for a rejected header request');
    });
    const payload = createPayload();
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': await sign(), ...metadata });

    const result = await authenticateAccess(optionsWith(keys), { headers, payload });

    expect(result).toEqual({ user: null });
    expect(payload.logger.warn).toHaveBeenCalledTimes(1);
    expect(payload.logger.warn).toHaveBeenCalledWith({ err: expect.any(CrossSiteAccessRequest), source: 'header' }, 'Cloudflare Access authentication rejected');
    expect(keys).not.toHaveBeenCalled();
  });

  test('authenticates a header token on a top-level cross-site navigation (Access login landing)', async () => {
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': await sign(), 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' });

    const result = await authenticateAccess(optionsWith(), { headers, payload: createPayload() });

    expect(result.user?.email).toBe(EMAIL);
  });

  test('returns null for an invalid token without throwing', async () => {
    const payload = createPayload();
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': await sign('other-aud') });

    const result = await authenticateAccess(optionsWith(), { headers, payload });

    expect(result).toEqual({ user: null });
    expect(payload.logger.warn).toHaveBeenCalledTimes(1);
  });

  test('returns null when user resolution fails', async () => {
    const payload = createPayload(async () => {
      throw new Error('database is down');
    });
    const headers = new Headers({ 'Cf-Access-Jwt-Assertion': await sign() });

    const result = await authenticateAccess(optionsWith(), { headers, payload });

    expect(result).toEqual({ user: null });
    expect(payload.logger.error).toHaveBeenCalledTimes(1);
  });
});

describe('createAccessStrategy', () => {
  test('is named cloudflare-access', () => {
    const strategy = createAccessStrategy({ teamDomain: TEAM, aud: ['aud-1'], collection: 'users', keys: createLocalJWKSet({ keys: [] }) });

    expect(strategy.name).toBe(ACCESS_STRATEGY_NAME);
    expect(ACCESS_STRATEGY_NAME).toBe('cloudflare-access');
  });
});
