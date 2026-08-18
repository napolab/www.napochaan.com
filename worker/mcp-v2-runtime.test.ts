import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';

// v1 では mcp-handler が Node 版 transport を掴んでいたため workerd 上でリクエストが
// ハングした(reports/2026-08-18-payload-plugin-mcp-workerd-evaluation.md)。
// route.test.ts は SDK を vi.mock しているのでこの層を守れない。ここだけが
// 「実物の SDK が workerd で動く」ことを保証している。消さないこと。
//
// 各テストに明示的な timeout(第3引数)を付けている理由: この transport.handleRequest が
// 二度とハングしないと保証するのがこのファイルの存在意義そのもの。await が解決しなければ
// assertion は一切実行されず、テストを失敗させる唯一の仕組みが vitest のグローバル既定
// timeout(5000ms)になってしまう — それはどこか別の設定ファイルで変更されうる値であり、
// ハング検知をそこに依存させてはならない。だから timeout は各 it() にこの場で明示する。
// 削除しないこと。
const HANG_DETECTION_TIMEOUT_MS = 10_000;

// JSON-RPC のエラー封筒。HTTP 200 のまま { error: {...} } が返るケースを先に弾くための型。
type JsonRpcErrorEnvelope = {
  error?: { code: number; message: string };
};

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
  it(
    'responds to tools/list without hanging',
    async () => {
      const response = await handle({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

      expect(response.status).toBe(200);
      const payload = (await response.json()) as JsonRpcErrorEnvelope & { result?: { tools?: { name: string }[] } };
      expect(payload.error).toBeUndefined();
      expect(payload.result?.tools?.map((tool) => tool.name)).toContain('echo');
    },
    HANG_DETECTION_TIMEOUT_MS,
  );

  it(
    'executes a tool call',
    async () => {
      const response = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'echo', arguments: { value: 'ok' } } });

      expect(response.status).toBe(200);
      const payload = (await response.json()) as JsonRpcErrorEnvelope & { result?: { content?: { text?: string }[] } };
      expect(payload.error).toBeUndefined();
      expect(payload.result?.content?.[0]?.text).toBe('ok');
    },
    HANG_DETECTION_TIMEOUT_MS,
  );

  // 意図的に custom jsonSchemaValidator を注入していない: workerd 上では SDK が
  // @cfworker/json-schema ベースのバリデータを自動選択する想定に依存している。
  // ここまでのテストは全て schema に適合した引数しか送っておらず、バリデータが
  // 無害な no-op にすり替わっていても検知できない。schema 違反の引数(value に
  // number)を送り、実際に拒否されることを確認する。
  //
  // 実測(workerd, @modelcontextprotocol/server v2): HTTP status は 200 のままで、
  // JSON-RPC の error 封筒は付かない。バリデーションエラーは
  // result.isError === true と result.content[0].text の文言として表現される。
  it(
    'rejects a tool call with schema-invalid arguments',
    async () => {
      const response = await handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'echo', arguments: { value: 123 } } });

      expect(response.status).toBe(200);
      const payload = (await response.json()) as JsonRpcErrorEnvelope & { result?: { content?: { text?: string }[]; isError?: boolean } };
      expect(payload.error).toBeUndefined();
      expect(payload.result?.isError).toBe(true);
      expect(payload.result?.content?.[0]?.text).toContain('Invalid arguments for tool echo');
    },
    HANG_DETECTION_TIMEOUT_MS,
  );
});
