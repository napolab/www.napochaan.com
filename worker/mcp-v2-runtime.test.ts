import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';

// v1 では mcp-handler が Node 版 transport を掴んでいたため workerd 上でリクエストが
// ハングした(reports/2026-08-18-payload-plugin-mcp-workerd-evaluation.md)。
// route.test.ts は SDK を vi.mock しているのでこの層を守れない。ここだけが
// 「実物の SDK が workerd で動く」ことを保証している。消さないこと。
const buildRequest = (body: unknown): Request =>
  new Request('https://example.test/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  });

const handle = async (body: unknown): Promise<Response> => {
  const server = new McpServer({ name: 'runtime-probe', version: '1.0.0' });
  server.registerTool('echo', { title: 'echo', description: 'workerd 実行確認用', inputSchema: { value: z.string() } }, ({ value }) => ({ content: [{ type: 'text' as const, text: value }] }));
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(buildRequest(body));
};

describe('MCP v2 SDK on workerd', () => {
  it('responds to tools/list without hanging', async () => {
    const response = await handle({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { result?: { tools?: { name: string }[] } };
    expect(payload.result?.tools?.map((tool) => tool.name)).toContain('echo');
  });

  it('executes a tool call', async () => {
    const response = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'echo', arguments: { value: 'ok' } } });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { result?: { content?: { text?: string }[] } };
    expect(payload.result?.content?.[0]?.text).toBe('ok');
  });
});
