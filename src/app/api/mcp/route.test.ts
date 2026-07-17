import { describe, expect, it, vi } from 'vitest';

const findByID = vi.fn();

vi.mock('@lib/payload/client', () => ({
  getPayloadClient: async () => ({ findByID, config: { editor: { editorConfig: {} } } }),
}));
vi.mock('@payloadcms/richtext-lexical', () => ({
  editorConfigFactory: { fromFeatures: async () => ({}) },
  convertMarkdownToLexical: () => ({}),
  convertLexicalToMarkdown: () => '',
  BlocksFeature: () => ({}),
  lexicalEditor: () => ({}),
}));
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: class {
    registerTool(): void {}
    async connect(): Promise<void> {}
  },
}));
vi.mock('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js', () => ({
  WebStandardStreamableHTTPServerTransport: class {
    async handleRequest(): Promise<Response> {
      return new Response('{}', { status: 200 });
    }
  },
}));

const { POST } = await import('./route');

describe('POST /api/mcp', () => {
  it('returns 404 without the internal user header', async () => {
    const response = await POST(new Request('http://localhost/api/mcp', { method: 'POST' }));
    expect(response.status).toBe(404);
  });

  it('returns 401 for an unknown user', async () => {
    findByID.mockResolvedValue(null);
    const response = await POST(new Request('http://localhost/api/mcp', { method: 'POST', headers: { 'x-mcp-user-id': '999' } }));
    expect(response.status).toBe(401);
  });

  it('returns 401 for a non-numeric user header without calling findByID', async () => {
    findByID.mockClear();
    const response = await POST(new Request('http://localhost/api/mcp', { method: 'POST', headers: { 'x-mcp-user-id': 'abc' } }));
    expect(response.status).toBe(401);
    expect(findByID).not.toHaveBeenCalled();
  });

  it('delegates to the transport for a valid user', async () => {
    findByID.mockResolvedValue({ id: 1, email: 'dev@napochaan.com' });
    const response = await POST(new Request('http://localhost/api/mcp', { method: 'POST', headers: { 'x-mcp-user-id': '1' } }));
    expect(response.status).toBe(200);
  });
});
