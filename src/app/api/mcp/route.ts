import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createMarkdownCodec } from '@lib/mcp/markdown';
import { registerBlogTools } from '@lib/mcp/tools';
import { getPayloadClient } from '@lib/payload/client';

import type { LexicalRichTextAdapter } from '@payloadcms/richtext-lexical';
import type { RichTextAdapter } from 'payload';

// `SanitizedConfig['editor']` is typed as the generic core `RichTextAdapter`
// (payload doesn't know about lexical specifics), but this project's root
// editor is always `lexicalEditor(...)`, which resolves to a
// `LexicalRichTextAdapter` — the same shape carrying `.editorConfig` that
// `editorConfigFactory.fromField` reads off field-level editors.
const isLexicalRichTextAdapter = (adapter: RichTextAdapter | undefined): adapter is LexicalRichTextAdapter => adapter !== undefined && 'editorConfig' in adapter;

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

  // `editorConfigFactory.default` resolves Payload's generic default editor
  // config (globally cached) — it is NOT derived from `payload.config.editor`
  // at all, so it never includes this project's BlocksFeature([ImageRow])
  // registration. `payload.config.editor.editorConfig` IS the project's real
  // root editor config (see scripts/verify-image-row-roundtrip.ts).
  if (!isLexicalRichTextAdapter(payload.config.editor)) return new Response('Editor config unavailable', { status: 500 });
  const editorConfig = payload.config.editor.editorConfig;

  // MCP SDK 1.26+ はリクエストごとに server / transport を新規生成する必要がある
  // (共有すると "already connected" で throw する)。生成は安価。
  const server = new McpServer({ name: 'napochaan-blog', version: '1.0.0' });
  registerBlogTools(server, { payload, user, codec: createMarkdownCodec(editorConfig) });

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
