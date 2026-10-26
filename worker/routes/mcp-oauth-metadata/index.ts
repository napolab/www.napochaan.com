import { parseAudiences } from '@napolab/cloudflare-access-core/audiences';
import { normalizeTeamDomain } from '@napolab/cloudflare-access-core/team-domain';
import { accessIssuer } from '@napolab/cloudflare-access-core/verify';
import { createFactory } from 'hono/factory';
import { err, ok, Result, ResultAsync } from 'neverthrow';

import type { Context } from 'hono';

// cloudflare-env.d.ts は .dev.vars から生成され、CF_ACCESS_MCP_AUD はまだ載っていないことがある
// (src/app/api/mcp/route.ts と同じ理由)。必要なキーだけを optional で受ける。
type MCPAccessEnv = Partial<Record<'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_MCP_AUD', string>>;
type HonoEnv = { Bindings: MCPAccessEnv };

export type MCPOAuthMetadataFetcher = (input: string) => Promise<Response>;

// RFC 9728 の protected resource metadata。
export type ProtectedResourceMetadata = { resource: string; authorization_servers: readonly string[] };

const PROTECTED_RESOURCE_PATH = '/.well-known/oauth-protected-resource/mcp';
const AUTHORIZATION_SERVER_PATH = '/.well-known/oauth-authorization-server';
const MCP_RESOURCE_PATH = '/mcp';

// 公開の discovery 情報なので共有キャッシュに載せてよい。設定変更が早く効くよう TTL は短く。
const DISCOVERY_CACHE_POLICY = 'public, max-age=300';
// 上流の一時的な失敗を edge に残さない。
const FAILURE_CACHE_POLICY = 'no-store';

export class AuthorizationServerUnreachable extends Error {
  override readonly name = 'AuthorizationServerUnreachable';

  constructor(cause: unknown) {
    super('Failed to fetch the Cloudflare Access authorization server metadata', { cause });
  }
}

export class AuthorizationServerRespondedWithError extends Error {
  override readonly name = 'AuthorizationServerRespondedWithError';

  constructor(readonly status: number) {
    super(`Cloudflare Access authorization server metadata responded with ${status}`);
  }
}

export class AuthorizationServerMetadataNotJSON extends Error {
  override readonly name = 'AuthorizationServerMetadataNotJSON';

  constructor(cause: unknown) {
    super('Cloudflare Access authorization server metadata is not JSON', { cause });
  }
}

export type AuthorizationServerMetadataError = AuthorizationServerUnreachable | AuthorizationServerRespondedWithError | AuthorizationServerMetadataNotJSON;

// 空白だけ(undefined)も、team 名にならない値(normalizeTeamDomain が throw)も「未設定」として扱う。
const readTeamDomain = (env: MCPAccessEnv): string | undefined => Result.fromThrowable(normalizeTeamDomain, (cause) => cause)(env.CF_ACCESS_TEAM_DOMAIN).unwrapOr(undefined);

// parseAudiences は string しか受けない。env 未設定(undefined)は AUD 無しとして扱う。
const hasMCPAudiences = (env: MCPAccessEnv): boolean => env.CF_ACCESS_MCP_AUD !== undefined && parseAudiences(env.CF_ACCESS_MCP_AUD).length > 0;

// /mcp の検証(src/app/api/mcp/route.ts)が成立する設定のときだけ issuer を返す。
// それ以外は undefined = discovery を出さない(出すと動かない OAuth フローにクライアントを誘い込む)。
export const resolveMCPAccessIssuer = (env: MCPAccessEnv): string | undefined => {
  const teamDomain = readTeamDomain(env);
  if (teamDomain === undefined) return undefined;
  if (!hasMCPAudiences(env)) return undefined;

  return accessIssuer(teamDomain);
};

export const toProtectedResourceMetadata = (origin: string, issuer: string): ProtectedResourceMetadata => ({
  resource: new URL(MCP_RESOURCE_PATH, origin).href,
  authorization_servers: [issuer],
});

const authorizationServerMetadataURL = (issuer: string): string => new URL(AUTHORIZATION_SERVER_PATH, issuer).href;

const requestMetadata = (fetcher: MCPOAuthMetadataFetcher, url: string): ResultAsync<Response, AuthorizationServerUnreachable> =>
  ResultAsync.fromPromise(fetcher(url), (cause) => new AuthorizationServerUnreachable(cause));

const ensureOK = (response: Response): Result<Response, AuthorizationServerRespondedWithError> => (response.ok ? ok(response) : err(new AuthorizationServerRespondedWithError(response.status)));

const readBody = (response: Response): ResultAsync<string, AuthorizationServerUnreachable> => ResultAsync.fromPromise(response.text(), (cause) => new AuthorizationServerUnreachable(cause));

// 中身は書き換えずに返す。JSON として読めることだけ確かめる(HTML のエラーページ等を 200 で流さない)。
const ensureJSON = (body: string): Result<string, AuthorizationServerMetadataNotJSON> =>
  Result.fromThrowable(
    (text: string): unknown => JSON.parse(text),
    (cause) => new AuthorizationServerMetadataNotJSON(cause),
  )(body).map(() => body);

export const fetchAuthorizationServerMetadata = (fetcher: MCPOAuthMetadataFetcher, issuer: string): ResultAsync<string, AuthorizationServerMetadataError> =>
  requestMetadata(fetcher, authorizationServerMetadataURL(issuer)).andThen(ensureOK).andThen(readBody).andThen(ensureJSON);

const discoveryResponse = (body: string): Response => new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': DISCOVERY_CACHE_POLICY } });

const badGateway = (): Response => new Response('Bad Gateway', { status: 502, headers: { 'Cache-Control': FAILURE_CACHE_POLICY } });

const defaultFetcher: MCPOAuthMetadataFetcher = (input) => fetch(input);

type CreateMCPOAuthMetadataRoutesArgs = { fetcher?: MCPOAuthMetadataFetcher };

// /mcp の Access はパス単位アプリなので、Access は /.well-known/cloudflare-access-protected-resource/mcp しか
// 返さず、標準の discovery(RFC 9728 / RFC 8414)は origin に落ちて 404 になる。MCP Portal の DCR は
// 標準の discovery を辿るので、ここで同じ内容を返す。MCP Access が未設定なら next() で今まで通り(404)。
export const createMCPOAuthMetadataRoutes = ({ fetcher = defaultFetcher }: CreateMCPOAuthMetadataRoutesArgs = {}) => {
  const factory = createFactory<HonoEnv>();
  const app = factory.createApp();

  const whenMCPAccessConfigured = (respond: (c: Context<HonoEnv>, issuer: string) => Response | Promise<Response>) =>
    factory.createMiddleware(async (c, next) => {
      const issuer = resolveMCPAccessIssuer(c.env);
      if (issuer === undefined) return next();

      return respond(c, issuer);
    });

  app.get(
    PROTECTED_RESOURCE_PATH,
    whenMCPAccessConfigured((c, issuer) => discoveryResponse(JSON.stringify(toProtectedResourceMetadata(new URL(c.req.url).origin, issuer)))),
  );

  app.get(
    AUTHORIZATION_SERVER_PATH,
    whenMCPAccessConfigured(async (_, issuer) => (await fetchAuthorizationServerMetadata(fetcher, issuer)).match(discoveryResponse, badGateway)),
  );

  return app;
};
