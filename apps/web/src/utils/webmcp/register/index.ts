import type { ModelContext, WebMCPTool } from '../types';

const isModelContext = (value: unknown): value is ModelContext => typeof value === 'object' && value !== null && 'registerTool' in value && typeof value.registerTool === 'function';

const modelContextOf = (host: object): ModelContext | undefined => {
  if (!('modelContext' in host) || !isModelContext(host.modelContext)) return undefined;

  return host.modelContext;
};

// `document.modelContext` per the current spec; older Chrome builds exposed it on
// `navigator` instead.
export const resolveModelContext = (document: object, navigator: object): ModelContext | undefined => modelContextOf(document) ?? modelContextOf(navigator);

// `async` so a synchronous throw (older API) becomes a rejection like the spec's
// DOMException (duplicate name, invalid schema, blocked by policy).
const registerOne = async (modelContext: ModelContext, tool: WebMCPTool, signal: AbortSignal): Promise<string> => {
  await modelContext.registerTool(tool, { signal });

  return tool.name;
};

// Registers each tool independently: one rejected registration never blocks the rest
// or surfaces as an unhandled rejection. Resolves to the names that registered.
export const registerWebMCPTools = async (modelContext: ModelContext | undefined, tools: readonly WebMCPTool[], signal: AbortSignal): Promise<readonly string[]> => {
  if (modelContext === undefined) return [];
  const outcomes = await Promise.allSettled(tools.map((tool) => registerOne(modelContext, tool, signal)));

  return outcomes.flatMap((outcome) => (outcome.status === 'fulfilled' ? [outcome.value] : []));
};
