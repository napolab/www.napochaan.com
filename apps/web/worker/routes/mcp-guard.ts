import { createFactory } from 'hono/factory';

type HonoEnv = {
  Bindings: Cloudflare.Env;
};

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

// /api/mcp(Next の MCP route handler)への到達経路は、Cloudflare Access が守る /mcp を
// worker/routes/mcp が in-process forward する経路(この Hono app を経由しない)のみに限定する。
// 公開インターネットからここに届いたリクエストは全て拒否する。
// route.ts は Cf-Access-Jwt-Assertion を自前で検証するので、この遮断は多層防御
// (Access を迂回した直叩きを route の検証より手前で落とす)。
app.all('/api/mcp', (c) => c.text('Not Found', 404));
app.all('/api/mcp/*', (c) => c.text('Not Found', 404));

export const mcpGuardRoutes = app;
