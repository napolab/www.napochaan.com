import type { ToolResult } from './tool-result';

// Minimal local model of the WebMCP imperative API (lib.dom has none), following the
// WebMCP Draft Community Group Report of 13 November 2026
// (https://webmachinelearning.github.io/webmcp/): `ModelContextTool`,
// `ModelContextRegisterToolOptions` and `ToolExecuteCallbackOptions`.

// Every input of these tools is a string (optionally an enum), so the schema is modeled
// only as far as they use it — still plain JSON Schema.
type StringPropertySchema = { type: 'string'; description: string; enum?: readonly string[] };

export type ToolInputSchema = {
  type: 'object';
  properties: Readonly<Record<string, StringPropertySchema>>;
  required?: readonly string[];
  additionalProperties: false;
};

// Required in the spec; optional here because the older `navigator.modelContext`
// (early Chrome builds) passed a client object without `signal` as the second argument.
export type ToolExecuteOptions = { signal?: AbortSignal };

export type WebMCPTool = {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  annotations: { readOnlyHint: boolean };
  // The agent's JSON-parsed arguments: untrusted, so each tool narrows them itself.
  execute: (input: unknown, options?: ToolExecuteOptions) => Promise<ToolResult>;
};

export interface ModelContext {
  // A Promise per the spec; the older navigator API returned nothing, hence `unknown`.
  registerTool(tool: WebMCPTool, options: { signal: AbortSignal }): unknown;
}
