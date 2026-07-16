import { createFactory } from 'hono/factory';

type HonoEnv = {
  Bindings: Cloudflare.Env;
};

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

// /api/mcp(Next の MCP route handler)への到達経路は worker.ts の mcpAPIHandler が
// OAuth 検証後に行う in-process forward(この Hono app を経由しない)のみに限定する。
// 公開インターネットからここに届いたリクエストは全て拒否する。
// Pair: src/app/api/mcp/route.ts はこの遮断を前提に x-mcp-user-id を信頼する。
app.all('/api/mcp', (c) => c.text('Not Found', 404));
app.all('/api/mcp/*', (c) => c.text('Not Found', 404));

export const mcpGuardRoutes = app;
