import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { editorConfigFactory } from '@payloadcms/richtext-lexical';

import { createMarkdownCodec } from '@lib/mcp/markdown';
import { registerBlogTools } from '@lib/mcp/tools';
import { getPayloadClient } from '@lib/payload/client';

// Pair: worker/worker.ts の mcpAPIHandler が OAuth 検証後にこのヘッダーを付けて
// in-process forward する。外部からの /api/mcp は Hono 層(mcp-guard)で 404 に
// なるため、ここに届いた時点でヘッダーは信頼できる。
const MCP_USER_HEADER = 'x-mcp-user-id';

const handleMCPRequest = async (request: Request): Promise<Response> => {
  const userHeader = request.headers.get(MCP_USER_HEADER);
  if (userHeader === null) return new Response('Not Found', { status: 404 });

  const payload = await getPayloadClient();
  const user = await payload.findByID({
    collection: 'users',
    id: parseInt(userHeader, 10),
    disableErrors: true,
    overrideAccess: true,
  });
  if (user === null) return new Response('Unauthorized', { status: 401 });

  // MCP SDK 1.26+ はリクエストごとに server / transport を新規生成する必要がある
  // (共有すると "already connected" で throw する)。生成は安価。
  const editorConfig = await editorConfigFactory.default({ config: payload.config });
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
