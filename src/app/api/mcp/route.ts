import { getCloudflareContext } from '@opennextjs/cloudflare';
import { editorConfigFactory } from '@payloadcms/richtext-lexical';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createMarkdownCodec } from '@lib/mcp/markdown';
import { registerBlogTools } from '@lib/mcp/tools';
import { blogEditorFeatures } from '@lib/payload/editor-features';
import { getPayloadClient } from '@lib/payload/client';

import type { Blog } from '@payload-types';

// Pair: worker/worker.ts の mcpAPIHandler が OAuth 検証後にこのヘッダーを付けて
// in-process forward する。外部からの /api/mcp は Hono 層(mcp-guard, worker/app.ts。
// 登録順序は worker/app.test.ts で回帰テスト済み)で 404 になるため、ここに届いた
// 時点でヘッダーは信頼できる、という前提に立っている。
// 本サイトは実質シングルユーザーで id=1 は推測可能なため、下の findByID 一致は
// 「本物のユーザー ID との一致」自体を防御層として機能させるものではない。ここで
// 行っているのは principal の正規化(存在しない/壊れた ID を弾く)のみ。実質的な
// 認可境界は worker 層の Hono ガードであり、このヘッダーチェックを認可レイヤーとして
// 当てにしてはいけない。
const MCP_USER_HEADER = 'x-mcp-user-id';

const handleMCPRequest = async (request: Request): Promise<Response> => {
  const userHeader = request.headers.get(MCP_USER_HEADER);
  if (userHeader === null) return new Response('Not Found', { status: 404 });

  const userID = parseInt(userHeader, 10);
  if (Number.isNaN(userID)) return new Response('Unauthorized', { status: 401 });

  const payload = await getPayloadClient();
  const user = await payload.findByID({
    collection: 'users',
    id: userID,
    disableErrors: true,
    overrideAccess: true,
  });
  if (user === null) return new Response('Unauthorized', { status: 401 });

  // editorConfig は richtext-lexical の factory(このモジュールが import している
  // convertLexicalToMarkdown と同一の lexical コピー)で、プロジェクト共通の features
  // (BlocksFeature([ImageRow]) 込み)から組む。
  // NG: `editorConfigFactory.default` は汎用 default で block 未登録。
  // NG: `payload.config.editor.editorConfig` は payload.config 側の lexical コピーで
  //     作られ、ここの convertLexicalToMarkdown と ServerBlockNode のクラスが一致せず
  //     「multiple copies of lexical」で block 変換が throw する(next dev/バンドル環境)。
  const editorConfig = await editorConfigFactory.fromFeatures({ config: payload.config, features: blogEditorFeatures });

  // create_upload_url が発行する署名付き URL の HMAC secret。Payload 自体の secret を
  // 再利用する(専用 secret を新設せず、既存の秘匿値を流用する設計判断)。
  const { env } = await getCloudflareContext({ async: true });

  // MCP SDK 1.26+ はリクエストごとに server / transport を新規生成する必要がある
  // (共有すると "already connected" で throw する)。生成は安価。
  const server = new McpServer({ name: 'napochaan-blog', version: '1.0.0' });
  registerBlogTools(server, {
    payload,
    user,
    codec: createMarkdownCodec<Blog['body']>(editorConfig),
    signingSecret: env.PAYLOAD_SECRET,
    siteBaseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless モード
    enableJsonResponse: true, // SSE ではなく素の JSON 応答
  });
  await server.connect(transport);
  return transport.handleRequest(request);
};

export const POST = handleMCPRequest;
export const GET = handleMCPRequest;
export const DELETE = handleMCPRequest;
