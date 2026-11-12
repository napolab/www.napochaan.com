import { describe, expect, it } from 'vitest';

import { mcpGuardRoutes } from './mcp-guard';

describe('mcpGuardRoutes', () => {
  it('blocks external POST /api/mcp', async () => {
    const response = await mcpGuardRoutes.request('/api/mcp', { method: 'POST' });
    expect(response.status).toBe(404);
  });

  it('blocks external GET /api/mcp', async () => {
    const response = await mcpGuardRoutes.request('/api/mcp');
    expect(response.status).toBe(404);
  });

  it('blocks nested paths under /api/mcp/', async () => {
    const response = await mcpGuardRoutes.request('/api/mcp/anything', { method: 'POST' });
    expect(response.status).toBe(404);
  });

  it('does not intercept unrelated /api routes', async () => {
    const response = await mcpGuardRoutes.request('/api/blog');
    expect(response.status).toBe(404); // Hono 未マッチのデフォルト 404(ルート未定義)
    // 未マッチであることはハンドラ数で担保: guard は /api/mcp 系しか登録しない
  });

  it('registers only /api/mcp paths', () => {
    const paths = mcpGuardRoutes.routes.map((route) => route.path);
    expect(new Set(paths)).toEqual(new Set(['/api/mcp', '/api/mcp/*']));
  });
});
