// The MCP CallToolResult shape (`content` + `isError`). WebMCP's `execute` may resolve to
// any JSON-serializable value, but a rejected promise reaches the agent only as a bare
// "OperationError" DOMException (the message is dropped). Author-defined failures are
// therefore returned as `isError` results so the agent sees why the call failed.
type TextContent = { type: 'text'; text: string };

export type ToolResult = { isError?: true; content: readonly [TextContent] };

export const textResult = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });

export const errorResult = (message: string): ToolResult => ({ isError: true, content: [{ type: 'text', text: message }] });
