import { createAccessKeys } from '@napolab/payload-cloudflare-access/verify';
import { parseAudiences } from '@napolab/payload-cloudflare-access/audiences';
import { createPayloadUserStore } from '@napolab/payload-cloudflare-access/resolve-user';
import { normalizeTeamDomain } from '@napolab/payload-cloudflare-access/team-domain';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { editorConfigFactory } from '@payloadcms/richtext-lexical';
import { decodeJwt, errors as joseErrors } from 'jose';
import { Result, ResultAsync } from 'neverthrow';

import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server/validators/cf-worker';

import { ACCESS_ASSERTION_HEADER, authenticateMCPRequest } from '@lib/mcp/access-auth';
import { MCPUserLookupFailed } from '@lib/mcp/errors';
import { createMarkdownCodec } from '@lib/mcp/markdown';
import { registerBlogTools } from '@lib/mcp/tools';
import { registerLogTools } from '@lib/mcp/tools/logs';
import { registerWorkTools } from '@lib/mcp/tools/works';
import { blogEditorFeatures } from '@lib/payload/editor-features';
import { getPayloadClient } from '@lib/payload/client';

import type { FindUserByEmail, MCPAccessConfig, MCPAuthError } from '@lib/mcp/access-auth';
import type { AccessUser } from '@napolab/payload-cloudflare-access/resolve-user';
import type { Blog, User, Work } from '@payload-types';
import type { JWTPayload, JWTVerifyGetKey } from 'jose';
import type { Payload } from 'payload';

// 信頼の前提: この route が Cloudflare Access の JWT(Cf-Access-Jwt-Assertion header)を自分で検証し、
// その email の既存 Payload user を引いて principal にする。手前の層(worker / Access)が付けた
// 未検証のヘッダーを信じる経路は無い。JWT は MCP 用 Access アプリ(/mcp パス単位、AUD =
// CF_ACCESS_MCP_AUD)のものだけ通し、admin 用の CF_ACCESS_AUD は混ぜない。
// 外部からの /api/mcp 直叩きは引き続き Hono 層の mcp-guard(worker/app.ts。登録順序は
// worker/app.test.ts で回帰テスト済み)が 404 にする。これは多層防御であって、ここの検証を省く理由にはならない。
// 応答の契約: 認証失敗(JWT 無し・不正・user 不在)→ 403(401 は成功しようのない OAuth フローに
// クライアントを誘い込む)。CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_MCP_AUD が未設定・不正、または
// user の検索自体の失敗(D1 障害など)→ 500(fail closed)。MCP からは user を作らない。

// cloudflare-env.d.ts は .dev.vars から生成され、CF_ACCESS_MCP_AUD はまだ載っていないことがある。
// Cloudflare.Env をそのまま渡せるよう、必要なキーだけを optional で受ける(未設定は実行時にもありうる)。
type MCPAccessEnv = Partial<Record<'CF_ACCESS_TEAM_DOMAIN' | 'CF_ACCESS_MCP_AUD', string>>;

// jose の remote JWKS は自前でキャッシュするので、team 名ごとにモジュールスコープで 1 回だけ作って使い回す。
const accessKeysByTeam = new Map<string, JWTVerifyGetKey>();

const accessKeysFor = (teamDomain: string): JWTVerifyGetKey => {
  const cached = accessKeysByTeam.get(teamDomain);
  if (cached !== undefined) return cached;

  const keys = createAccessKeys(teamDomain);
  accessKeysByTeam.set(teamDomain, keys);
  return keys;
};

// 空白だけ(undefined)も、team 名にならない値(normalizeTeamDomain が throw)も「未設定」として扱う。
const readTeamDomain = (env: MCPAccessEnv): string | undefined => Result.fromThrowable(normalizeTeamDomain, (cause) => cause)(env.CF_ACCESS_TEAM_DOMAIN).unwrapOr(undefined);

const readMCPAudiences = (env: MCPAccessEnv): readonly string[] | undefined => {
  const audiences = parseAudiences(env.CF_ACCESS_MCP_AUD);
  return audiences.length === 0 ? undefined : audiences;
};

const toMCPAccessConfig = (env: MCPAccessEnv): MCPAccessConfig | undefined => {
  const teamDomain = readTeamDomain(env);
  const aud = readMCPAudiences(env);
  if (teamDomain === undefined || aud === undefined) return undefined;

  return { teamDomain, aud, keys: accessKeysFor(teamDomain) };
};

// どの env が欠けているかだけを出す(値は出さない)。
const notConfigured = (env: MCPAccessEnv): Response => {
  console.error('[mcp] Cloudflare Access is not configured for /api/mcp', {
    teamDomain: readTeamDomain(env) === undefined ? 'missing or invalid' : 'ok',
    mcpAud: readMCPAudiences(env) === undefined ? 'missing' : 'ok',
  });
  return new Response('Internal Server Error', { status: 500 });
};

// AccessUser は Payload の find が返す doc で runtime の `collection` を持たない。ツールが受ける User に揃える。
const toMCPUser = (user: AccessUser): User => ({ ...user, collection: 'users' });

// Payload の初期化は JWT の検証が通って user を引く段になってから行う(認証されないリクエストで初期化させない)。
// getPayloadClient はキャッシュされた singleton なので、認証後の MCP 処理で再度呼んでも初期化は 1 回きり。
const findUserByEmail: FindUserByEmail = async (email) => createPayloadUserStore(await getPayloadClient(), 'users').findByEmail(email);

// authenticateMCPRequest は user 検索の reject を認証失敗に折り込まず reject のまま返すので、
// ここで MCPUserLookupFailed に包んで 500 にする(403 に化けさせない)。
const authenticate = (headers: Headers, config: MCPAccessConfig): ResultAsync<AccessUser, MCPAuthError | MCPUserLookupFailed> =>
  ResultAsync.fromPromise(authenticateMCPRequest(headers, config, findUserByEmail), (cause) => new MCPUserLookupFailed(cause)).andThen((result) => result);

type AssertionClaims = { aud?: JWTPayload['aud']; type?: unknown };

// 検証前の JWT から aud / type だけを読む(AUD の取り違えを Workers のログで切り分ける用)。
// email・token そのものは出さない。壊れた token でもログ出力は throw させない。
const peekAssertionClaims = (headers: Headers): AssertionClaims => {
  const token = headers.get(ACCESS_ASSERTION_HEADER);
  if (token === null || token === '') return {};

  return Result.fromThrowable(
    decodeJwt,
    (cause) => cause,
  )(token)
    .map((claims): AssertionClaims => ({ aud: claims.aud, type: claims['type'] }))
    .unwrapOr({});
};

type JoseErrorCode = { code?: string };

// JWT の検証失敗(InvalidAccessToken)は jose の例外を cause に持つ。その code(ERR_JWT_EXPIRED 等)だけを出す。
// code は jose が定めた固定の文字列で、email・token は含まない。
const readJoseCode = (error: MCPAuthError): JoseErrorCode => (error.cause instanceof joseErrors.JOSEError ? { code: error.cause.code } : {});

const forbidden = (error: MCPAuthError, headers: Headers): Response => {
  console.warn('[mcp] Cloudflare Access authentication failed', { error: error.name, ...readJoseCode(error), ...peekAssertionClaims(headers) });
  return new Response('Forbidden', { status: 403 });
};

// cause(D1 / Payload の例外)はクエリ条件の email を含みうるので、そのままは出さず class 名だけ残す。
const lookupFailed = (error: MCPUserLookupFailed): Response => {
  console.error('[mcp] user lookup failed', { error: error.name, cause: error.cause instanceof Error ? error.cause.name : typeof error.cause });
  return new Response('Internal Server Error', { status: 500 });
};

const rejectRequest = (error: MCPAuthError | MCPUserLookupFailed, headers: Headers): Response => (error instanceof MCPUserLookupFailed ? lookupFailed(error) : forbidden(error, headers));

const serveMCP = async (request: Request, payload: Payload, user: User, signingSecret: string): Promise<Response> => {
  // editorConfig は richtext-lexical の factory(このモジュールが import している
  // convertLexicalToMarkdown と同一の lexical コピー)で、プロジェクト共通の features
  // (BlocksFeature([ImageRow]) 込み)から組む。
  // NG: `editorConfigFactory.default` は汎用 default で block 未登録。
  // NG: `payload.config.editor.editorConfig` は payload.config 側の lexical コピーで
  //     作られ、ここの convertLexicalToMarkdown と ServerBlockNode のクラスが一致せず
  //     「multiple copies of lexical」で block 変換が throw する(next dev/バンドル環境)。
  const editorConfig = await editorConfigFactory.fromFeatures({ config: payload.config, features: blogEditorFeatures });

  // server / transport はリクエストごとに新規生成する必要がある(共有すると
  // "already connected" で throw する)。生成は安価。
  // 元は SDK v1(@modelcontextprotocol/sdk 1.26+)で確認した制約だが、v2
  // (@modelcontextprotocol/server 2.0.0)でも同じ。実挙動は workerd 上の
  // worker/mcp-v2-runtime.test.ts が毎回この形で組み直して固定している。
  // jsonSchemaValidator を明示注入する理由: SDK の既定バリデータは実行時のランタイム判定では
  // なく、`@modelcontextprotocol/server` の `"./_shims"` エントリの **ビルド時 export condition**
  // (`workerd` | `browser` | `node` | `default`=node)で選ばれる。Next の webpack ビルドは
  // `node` を解決するため、無指定だと本番バンドルには Ajv(`AjvJsonSchemaValidator`)が入る。
  // Ajv はスキーマのコンパイルに `new Function(...)` を使うが、workerd はコード生成を禁止して
  // おり(`EvalError: Code generation from strings disallowed`)、Ajv 経路のツールを呼んだ瞬間に
  // 本番で 500 になる。`worker/mcp-v2-runtime.test.ts` はこの分岐を検知できない —
  // vitest の workers pool(`@cloudflare/vitest-pool-workers`)は `workerd` condition を解決する
  // ため、同じコードでもテストでは自動的に `@cfworker/json-schema` ベースの Workers 版が選ばれて
  // しまい、Next ビルドで実際に何が入るかとは無関係にグリーンになる。
  // ここで明示的に Workers 版を注入すれば、ビルドツールの export condition 解決に依存せず
  // Node/Workers 双方で同じバリデータが使われる(`@cfworker/json-schema` はこのパッケージに
  // 同梱済みなので依存追加は不要)。
  const server = new McpServer({ name: 'napochaan-blog', version: '1.0.0' }, { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() });
  registerBlogTools(server, {
    payload,
    user,
    codec: createMarkdownCodec<Blog['body']>(editorConfig),
    signingSecret,
    siteBaseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  });
  // logs は richText を持たないので codec は渡さない。
  registerLogTools(server, { payload, user });
  // works の本文は blog と同じ editor features で書かれるため、同じ editorConfig から codec を組む
  // (本文パイプラインも blog と共用、src/lib/mcp/tools/shared/body-pipeline)。
  registerWorkTools(server, {
    payload,
    user,
    codec: createMarkdownCodec<NonNullable<Work['body']>>(editorConfig),
    siteBaseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless モード
    enableJsonResponse: true, // SSE ではなく素の JSON 応答
  });
  await server.connect(transport);
  return transport.handleRequest(request);
};

const handleMCPRequest = async (request: Request): Promise<Response> => {
  const { env } = await getCloudflareContext({ async: true });
  const config = toMCPAccessConfig(env);
  if (config === undefined) return notConfigured(env);

  // create_upload_url が発行する署名付き URL の HMAC secret には Payload 自体の secret を
  // 再利用する(専用 secret を新設せず、既存の秘匿値を流用する設計判断)。
  return authenticate(request.headers, config).match(
    async (user) => serveMCP(request, await getPayloadClient(), toMCPUser(user), env.PAYLOAD_SECRET),
    (error) => rejectRequest(error, request.headers),
  );
};

export const POST = handleMCPRequest;
export const GET = handleMCPRequest;
export const DELETE = handleMCPRequest;
