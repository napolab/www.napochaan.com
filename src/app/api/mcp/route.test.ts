import { accessIssuer } from '@napolab/payload-cloudflare-access/verify';
import { SignJWT } from 'jose';
import type { JWTPayload } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACCESS_ASSERTION_HEADER } from '@lib/mcp/access-auth';

const TEAM = 'napochaan';
const MCP_AUD = 'mcp-aud';
const ADMIN_AUD = 'admin-aud';
const KID = 'route-test-key';
const EMAIL = 'owner@example.com';
const USER = { id: 1, email: EMAIL, updatedAt: '2026-10-22T00:00:00.000Z', createdAt: '2026-10-22T00:00:00.000Z' };

// createAccessKeys の mock が閉じ込める鍵束。vi.mock は import より先に巻き上げられるので、
// jose も動的 import で取り込む。
const keyring = await vi.hoisted(async () => {
  const { createLocalJWKSet, exportJWK, generateKeyPair } = await import('jose');
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const jwk = { ...(await exportJWK(publicKey)), kid: 'route-test-key', alg: 'RS256' };
  return { signingKey: privateKey, keys: createLocalJWKSet({ keys: [jwk] }) };
});

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  getPayloadClient: vi.fn(),
  getCloudflareContext: vi.fn(),
  createAccessKeys: vi.fn(),
}));

const BASE_ENV = { PAYLOAD_SECRET: 'test-payload-secret', CF_ACCESS_TEAM_DOMAIN: 'napochaan', CF_ACCESS_MCP_AUD: 'mcp-aud' };

vi.mock('@lib/payload/client', () => ({
  getPayloadClient: mocks.getPayloadClient,
}));
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}));
vi.mock('@napolab/payload-cloudflare-access/verify', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@napolab/payload-cloudflare-access/verify')>()),
  createAccessKeys: mocks.createAccessKeys,
}));
vi.mock('@payloadcms/richtext-lexical', () => ({
  editorConfigFactory: { fromFeatures: async () => ({}) },
  convertMarkdownToLexical: () => ({}),
  convertLexicalToMarkdown: () => '',
  BlocksFeature: () => ({}),
  CodeBlock: () => ({ slug: 'Code', fields: [] }),
  lexicalEditor: () => ({}),
}));
vi.mock('@modelcontextprotocol/server', () => ({
  McpServer: class {
    registerTool(): void {}
    async connect(): Promise<void> {}
  },
  WebStandardStreamableHTTPServerTransport: class {
    async handleRequest(): Promise<Response> {
      return new Response('{}', { status: 200 });
    }
  },
}));

const { POST } = await import('./route');

const sign = (claims: JWTPayload, aud = MCP_AUD): Promise<string> =>
  new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: KID }).setIssuer(accessIssuer(TEAM)).setAudience(aud).setIssuedAt().setExpirationTime('5m').sign(keyring.signingKey);

const appToken = (aud = MCP_AUD): Promise<string> => sign({ type: 'app', email: EMAIL }, aud);

// clockTolerance を十分に超えて期限切れの token。
const expiredToken = (): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ type: 'app', email: EMAIL })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(accessIssuer(TEAM))
    .setAudience(MCP_AUD)
    .setIssuedAt(now - 7200)
    .setExpirationTime(now - 3600)
    .sign(keyring.signingKey);
};

const mcpRequest = (headers: Record<string, string> = {}): Request => new Request('http://localhost/api/mcp', { method: 'POST', headers });

const withAssertion = (token: string): Request => mcpRequest({ [ACCESS_ASSERTION_HEADER]: token });

const withEnv = (overrides: Record<string, string | undefined>): void => {
  mocks.getCloudflareContext.mockResolvedValueOnce({ env: { ...BASE_ENV, ...overrides } });
};

describe('POST /api/mcp', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.find.mockReset();
    mocks.find.mockResolvedValue({ docs: [USER] });
    mocks.getPayloadClient.mockReset();
    mocks.getPayloadClient.mockResolvedValue({ find: mocks.find, config: { editor: { editorConfig: {} } } });
    mocks.getCloudflareContext.mockReset();
    mocks.getCloudflareContext.mockResolvedValue({ env: BASE_ENV });
    mocks.createAccessKeys.mockImplementation(() => keyring.keys);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('authentication (403)', () => {
    it('rejects a request without the Access assertion', async () => {
      const response = await POST(mcpRequest());
      expect(response.status).toBe(403);
    });

    it('ignores the former internal user-id header and never looks a user up', async () => {
      const response = await POST(mcpRequest({ 'x-mcp-user-id': '1' }));
      expect(response.status).toBe(403);
      expect(mocks.find).not.toHaveBeenCalled();
    });

    it('rejects a valid token whose email has no Payload user', async () => {
      mocks.find.mockResolvedValue({ docs: [] });
      const response = await POST(withAssertion(await appToken()));
      expect(response.status).toBe(403);
    });

    it('rejects a token signed for the admin Access application', async () => {
      const response = await POST(withAssertion(await appToken(ADMIN_AUD)));
      expect(response.status).toBe(403);
      expect(mocks.find).not.toHaveBeenCalled();
    });

    it.each([
      ['without an assertion', () => mcpRequest()],
      ['with a token for the admin Access application', async () => withAssertion(await appToken(ADMIN_AUD))],
    ])('does not initialize Payload for a request %s', async (_label, makeRequest) => {
      const response = await POST(await makeRequest());
      expect(response.status).toBe(403);
      expect(mocks.getPayloadClient).not.toHaveBeenCalled();
    });

    it('rejects a malformed token without the failure log throwing', async () => {
      const response = await POST(withAssertion('not-a-jwt'));
      expect(response.status).toBe(403);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('failure log', () => {
    it('logs the error class plus the unverified aud and type only', async () => {
      const token = await appToken(ADMIN_AUD);
      await POST(withAssertion(token));

      expect(console.warn).toHaveBeenCalledWith(expect.any(String), { error: 'InvalidAccessToken', code: 'ERR_JWT_CLAIM_VALIDATION_FAILED', aud: ADMIN_AUD, type: 'app' });
      const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
      expect(logged).not.toContain(EMAIL);
      expect(logged).not.toContain(token);
    });

    it('logs the jose error code of an expired token', async () => {
      const token = await expiredToken();
      const response = await POST(withAssertion(token));

      expect(response.status).toBe(403);
      expect(console.warn).toHaveBeenCalledWith(expect.any(String), { error: 'InvalidAccessToken', code: 'ERR_JWT_EXPIRED', aud: MCP_AUD, type: 'app' });
      const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
      expect(logged).not.toContain(EMAIL);
      expect(logged).not.toContain(token);
    });

    it('does not log the email when the user is missing', async () => {
      mocks.find.mockResolvedValue({ docs: [] });
      await POST(withAssertion(await appToken()));

      expect(console.warn).toHaveBeenCalledWith(expect.any(String), { error: 'MCPUserNotFound', aud: MCP_AUD, type: 'app' });
      expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(EMAIL);
    });
  });

  describe('success', () => {
    it('delegates to the transport for a valid token of an existing user', async () => {
      const response = await POST(withAssertion(await appToken()));
      expect(response.status).toBe(200);
      expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'users', where: { email: { equals: EMAIL } } }));
    });

    it('creates the Access JWKS once per team and reuses it', async () => {
      // 鍵のキャッシュはモジュールスコープなので、まっさらな route を読み直して数える。
      vi.resetModules();
      const fresh = await import('./route');
      mocks.createAccessKeys.mockClear();

      await fresh.POST(withAssertion(await appToken()));
      await fresh.POST(withAssertion(await appToken()));

      expect(mocks.createAccessKeys).toHaveBeenCalledTimes(1);
      expect(mocks.createAccessKeys).toHaveBeenCalledWith(TEAM);
    });
  });

  describe('server errors (500)', () => {
    it.each([
      ['CF_ACCESS_MCP_AUD unset', { CF_ACCESS_MCP_AUD: undefined }],
      ['CF_ACCESS_MCP_AUD blank entries only', { CF_ACCESS_MCP_AUD: ' , ' }],
      ['CF_ACCESS_TEAM_DOMAIN unset', { CF_ACCESS_TEAM_DOMAIN: undefined }],
      ['CF_ACCESS_TEAM_DOMAIN malformed', { CF_ACCESS_TEAM_DOMAIN: 'not a team!' }],
    ])('fails closed when %s', async (_label, overrides) => {
      withEnv(overrides);
      const response = await POST(withAssertion(await appToken()));
      expect(response.status).toBe(500);
      expect(mocks.find).not.toHaveBeenCalled();
    });

    it('fails closed when unconfigured even without an assertion', async () => {
      withEnv({ CF_ACCESS_MCP_AUD: undefined });
      const response = await POST(mcpRequest());
      expect(response.status).toBe(500);
    });

    it('answers 500, not 403, when the user lookup itself fails', async () => {
      mocks.find.mockRejectedValue(new Error('D1 unavailable'));
      const response = await POST(withAssertion(await appToken()));
      expect(response.status).toBe(500);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(expect.any(String), { error: 'MCPUserLookupFailed', cause: 'Error' });
    });
  });
});
