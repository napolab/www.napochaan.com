import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import type { JWK } from 'jose';
import { describe, expect, it } from 'vitest';

import { accessIssuer, verifyAccessJWT } from '../packages/payload-cloudflare-access/src/verify';

// 公開 export の無い verify を相対 import で直接叩く。jose 6 が workerd(WebCrypto)上で
// 署名検証できることを実物で保証する。unit project(node)の verify.test.ts では
// この層を守れない。消さないこと。
const TEAM = 'napolab';
const KID = 'runtime-key';
const TIMEOUT_MS = 10_000;

describe('Cloudflare Access JWT verification on workerd', () => {
  it('runs on workerd, not node', () => {
    expect(navigator.userAgent).toContain('Cloudflare-Workers');
  });

  it(
    'verifies a locally signed app token',
    async () => {
      const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
      const jwk: JWK = { ...(await exportJWK(publicKey)), kid: KID, alg: 'RS256' };
      const token = await new SignJWT({ type: 'app', email: 'napo@example.com' })
        .setProtectedHeader({ alg: 'RS256', kid: KID })
        .setIssuer(accessIssuer(TEAM))
        .setAudience('aud-1')
        .setExpirationTime('5m')
        .sign(privateKey);

      const result = await verifyAccessJWT({ token, teamDomain: TEAM, aud: ['aud-1'], keys: createLocalJWKSet({ keys: [jwk] }) });

      expect(result._unsafeUnwrap()).toEqual({ email: 'napo@example.com' });
    },
    TIMEOUT_MS,
  );
});
