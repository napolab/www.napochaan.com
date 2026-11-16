import { describe, expect, it, vi } from 'vitest';

import { registerWebMCPTools, resolveModelContext } from './index';

import type { ModelContext, WebMCPTool } from '../types';

const tool = (name: string): WebMCPTool => ({
  name,
  description: `${name} tool`,
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true },
  execute: async () => ({ content: [{ type: 'text', text: name }] }),
});

const modelContext = (registerTool: ModelContext['registerTool'] = vi.fn(async () => undefined)) => ({ registerTool });

describe('resolveModelContext', () => {
  it('prefers document.modelContext', () => {
    const fromDocument = modelContext();
    const fromNavigator = modelContext();

    expect(resolveModelContext({ modelContext: fromDocument }, { modelContext: fromNavigator })).toBe(fromDocument);
  });

  // Older Chrome builds exposed the API on navigator.
  it('falls back to navigator.modelContext', () => {
    const fromNavigator = modelContext();

    expect(resolveModelContext({}, { modelContext: fromNavigator })).toBe(fromNavigator);
  });

  it('is undefined when neither exposes a registerTool function', () => {
    expect(resolveModelContext({}, {})).toBeUndefined();
    expect(resolveModelContext({ modelContext: null }, { modelContext: { registerTool: 'nope' } })).toBeUndefined();
  });
});

describe('registerWebMCPTools', () => {
  it('registers every tool with the abort signal', async () => {
    const context = modelContext();
    const { signal } = new AbortController();
    const tools = [tool('a'), tool('b')];

    const registered = await registerWebMCPTools(context, tools, signal);

    expect(context.registerTool).toHaveBeenCalledTimes(2);
    expect(context.registerTool).toHaveBeenCalledWith(tools[0], { signal });
    expect(context.registerTool).toHaveBeenCalledWith(tools[1], { signal });
    expect(registered).toEqual(['a', 'b']);
  });

  it('does nothing without a model context', async () => {
    expect(await registerWebMCPTools(undefined, [tool('a')], new AbortController().signal)).toEqual([]);
  });

  // A duplicate name or a policy block rejects one registration (the older navigator API
  // may throw synchronously); the others still register and nothing goes unhandled.
  it('keeps registering when one registration rejects or throws', async () => {
    const registerTool = vi.fn(async (candidate: WebMCPTool) => {
      if (candidate.name === 'dup') throw new DOMException('duplicate', 'InvalidStateError');
    });
    const syncThrowing = vi.fn((candidate: WebMCPTool) => {
      if (candidate.name === 'sync') throw new Error('sync');
    });

    expect(await registerWebMCPTools(modelContext(registerTool), [tool('dup'), tool('ok')], new AbortController().signal)).toEqual(['ok']);
    expect(await registerWebMCPTools(modelContext(syncThrowing), [tool('sync'), tool('ok')], new AbortController().signal)).toEqual(['ok']);
  });
});
