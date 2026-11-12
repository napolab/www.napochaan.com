import { InvalidAccessToken, WrongAccessTokenType } from '@napolab/cloudflare-access-core/errors';
import { accessIssuer } from '@napolab/cloudflare-access-core/verify';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import type { CryptoKey, JWK, JWTPayload, JWTVerifyGetKey } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { MCPUserNotFound, MissingAccessAssertion } from '../errors';

import { ACCESS_ASSERTION_HEADER, authenticateMCPRequest } from './index';

import type { FindUserByEmail, MCPAccessConfig } from './index';
import type { AccessUser, UserStore } from '@napolab/payload-cloudflare-access/resolve-user';

const TEAM = 'napochaan';
const MCP_AUD = 'mcp-aud';
const ADMIN_AUD = 'admin-aud';
const KID = 'test-key';

const USER: AccessUser = { id: 1, email: 'owner@example.com', updatedAt: '2026-10-22T00:00:00.000Z', createdAt: '2026-10-22T00:00:00.000Z' };

type SignOptions = {
  aud?: string;
  issuer?: string;
  exp?: string;
  key?: CryptoKey;
};

type Keyring = { signingKey: CryptoKey; foreignKey: CryptoKey; keys: JWTVerifyGetKey };

const createKeyring = async (): Promise<Keyring> => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const foreign = await generateKeyPair('RS256', { extractable: true });
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: KID, alg: 'RS256' };
  return { signingKey: privateKey, foreignKey: foreign.privateKey, keys: createLocalJWKSet({ keys: [jwk] }) };
};

const sign = (keyring: Keyring, claims: JWTPayload, { aud = MCP_AUD, issuer = accessIssuer(TEAM), exp = '5m', key = keyring.signingKey }: SignOptions = {}): Promise<string> =>
  new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: KID }).setIssuer(issuer).setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(key);

const appClaims = (email: string): JWTPayload => ({ type: 'app', email });

const withAssertion = (token: string): Headers => new Headers({ [ACCESS_ASSERTION_HEADER]: token });

const configFor = (keyring: Keyring): MCPAccessConfig => ({ teamDomain: TEAM, aud: [MCP_AUD], keys: keyring.keys });

const findReturning = (user: AccessUser | undefined) => vi.fn<FindUserByEmail>(async () => user);

describe('authenticateMCPRequest', () => {
  const state: { keyring?: Keyring } = {};

  beforeAll(async () => {
    state.keyring = await createKeyring();
  });

  const keyring = (): Keyring => {
    if (state.keyring === undefined) throw new Error('keyring not initialized');
    return state.keyring;
  };

  it('uses the Cloudflare Access assertion header name', () => {
    expect(ACCESS_ASSERTION_HEADER).toBe('Cf-Access-Jwt-Assertion');
  });

  it('returns the existing user for a valid MCP app token', async () => {
    const find = findReturning(USER);
    const token = await sign(keyring(), appClaims('owner@example.com'));

    const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

    expect(result._unsafeUnwrap()).toBe(USER);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith('owner@example.com');
  });

  it('normalizes the email (trim + lowercase) before looking the user up', async () => {
    const find = findReturning(USER);
    const token = await sign(keyring(), appClaims('  Owner@Example.COM '));

    const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

    expect(result.isOk()).toBe(true);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith('owner@example.com');
  });

  describe('rejects without touching the user store', () => {
    it('fails with MissingAccessAssertion when the header is absent', async () => {
      const find = findReturning(USER);

      const result = await authenticateMCPRequest(new Headers(), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingAccessAssertion);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with MissingAccessAssertion when the header is empty', async () => {
      const find = findReturning(USER);

      const result = await authenticateMCPRequest(withAssertion(''), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingAccessAssertion);
      expect(find).not.toHaveBeenCalled();
    });

    it('ignores the legacy x-mcp-user-id header', async () => {
      const find = findReturning(USER);

      const result = await authenticateMCPRequest(new Headers({ 'x-mcp-user-id': '1' }), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingAccessAssertion);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with InvalidAccessToken for a token minted for the admin AUD', async () => {
      const find = findReturning(USER);
      const token = await sign(keyring(), appClaims('owner@example.com'), { aud: ADMIN_AUD });

      const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidAccessToken);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with InvalidAccessToken for an expired token', async () => {
      const find = findReturning(USER);
      const token = await sign(keyring(), appClaims('owner@example.com'), { exp: '1h ago' });

      const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidAccessToken);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with InvalidAccessToken for a token signed by a key outside the JWKS', async () => {
      const find = findReturning(USER);
      const token = await sign(keyring(), appClaims('owner@example.com'), { key: keyring().foreignKey });

      const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidAccessToken);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with InvalidAccessToken for a token issued by another team', async () => {
      const find = findReturning(USER);
      const token = await sign(keyring(), appClaims('owner@example.com'), { issuer: accessIssuer('other-team') });

      const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidAccessToken);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with InvalidAccessToken for a malformed token', async () => {
      const find = findReturning(USER);

      const result = await authenticateMCPRequest(withAssertion('not-a-jwt'), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidAccessToken);
      expect(find).not.toHaveBeenCalled();
    });

    it('fails with WrongAccessTokenType for an org token', async () => {
      const find = findReturning(USER);
      const token = await sign(keyring(), { type: 'org', email: 'owner@example.com' });

      const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(WrongAccessTokenType);
      expect(find).not.toHaveBeenCalled();
    });
  });

  it('fails with MCPUserNotFound when no user has the email, and never creates one', async () => {
    // route は createPayloadUserStore の store から findByEmail だけを渡す。同じ store の create が呼ばれないことを確かめる。
    const store = { findByEmail: findReturning(undefined), create: vi.fn<UserStore['create']>() };
    const token = await sign(keyring(), appClaims('stranger@example.com'));

    const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), store.findByEmail);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(MCPUserNotFound);
    expect(error.message).not.toContain('stranger@example.com');
    expect(store.findByEmail).toHaveBeenCalledTimes(1);
    expect(store.findByEmail).toHaveBeenCalledWith('stranger@example.com');
    expect(store.create).not.toHaveBeenCalled();
  });

  it('fails with MCPUserNotFound when the email claim is only whitespace, without looking it up', async () => {
    const find = findReturning(USER);
    const token = await sign(keyring(), appClaims('   '));

    const result = await authenticateMCPRequest(withAssertion(token), configFor(keyring()), find);

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MCPUserNotFound);
    expect(find).not.toHaveBeenCalled();
  });

  it('lets a user-store failure reject instead of reporting it as an auth failure', async () => {
    const outage = new Error('D1 unavailable');
    const find = vi.fn<FindUserByEmail>(async () => {
      throw outage;
    });
    const token = await sign(keyring(), appClaims('owner@example.com'));

    await expect(authenticateMCPRequest(withAssertion(token), configFor(keyring()), find)).rejects.toBe(outage);
  });
});
