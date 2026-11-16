import { existsSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { siteNavItems } from '@utils/nav-items';

import { createWebMCPTools } from './index';
import { LIST_SECTIONS } from './list-entries';

import type { WebMCPTool } from '../types';

const ORIGIN = 'https://napochaan.com';

const markdownFetch = () => vi.fn(async (_input: string, _init: RequestInit) => new Response('# md', { headers: { 'Content-Type': 'text/markdown' } }));

const setup = (pathname = '/about') => {
  const fetch = markdownFetch();
  const navigate = vi.fn((_path: string) => undefined);
  const tools = createWebMCPTools({ fetch, navigate, getPathname: () => pathname, origin: ORIGIN });
  const toolNamed = (name: string): WebMCPTool => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (tool === undefined) throw new Error(`no tool ${name}`);
    return tool;
  };

  return { fetch, navigate, tools, toolNamed };
};

const signal = () => new AbortController().signal;

describe('createWebMCPTools', () => {
  it('defines get_page_markdown, navigate and list_entries', () => {
    expect(setup().tools.map((tool) => tool.name)).toEqual(['get_page_markdown', 'navigate', 'list_entries']);
  });

  // WebMCP rejects registration for an empty / non-[A-Za-z0-9_.-] name or an empty description.
  it('gives every tool a spec-valid name and a description', () => {
    for (const tool of setup().tools) {
      expect(tool.name).toMatch(/^[A-Za-z0-9_.-]{1,128}$/);
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  it('describes every input with a closed JSON Schema object', () => {
    for (const { inputSchema } of setup().tools) {
      // A JSON-serializable plain object (the browser stringifies the schema).
      expect(JSON.parse(JSON.stringify(inputSchema))).toEqual(inputSchema);
      expect(inputSchema.type).toBe('object');
      expect(inputSchema.additionalProperties).toBe(false);
      const names = Object.keys(inputSchema.properties);
      expect(names.length).toBeGreaterThan(0);
      for (const required of inputSchema.required ?? []) expect(names).toContain(required);
      for (const property of Object.values(inputSchema.properties)) {
        expect(property.type).toBe('string');
        expect(property.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('marks the two readers read-only and navigate not', () => {
    const { toolNamed } = setup();
    expect(toolNamed('get_page_markdown').annotations.readOnlyHint).toBe(true);
    expect(toolNamed('list_entries').annotations.readOnlyHint).toBe(true);
    expect(toolNamed('navigate').annotations.readOnlyHint).toBe(false);
  });
});

describe('get_page_markdown', () => {
  it('reads the current page when no path is given, at call time', async () => {
    const state = { pathname: '/about' };
    const fetch = markdownFetch();
    const tools = createWebMCPTools({ fetch, navigate: vi.fn(), getPathname: () => state.pathname, origin: ORIGIN });
    const tool = tools.find((candidate) => candidate.name === 'get_page_markdown');
    const options = { signal: signal() };

    state.pathname = '/blog/after-soft-navigation';
    const result = await tool?.execute({}, options);

    expect(fetch).toHaveBeenCalledWith('/blog/after-soft-navigation', { headers: { accept: 'text/markdown' }, signal: options.signal });
    expect(result).toEqual({ content: [{ type: 'text', text: '# md' }] });
  });

  it('reads the given site-relative path', async () => {
    const { fetch, toolNamed } = setup();
    await toolNamed('get_page_markdown').execute({ path: '/works/foo' }, { signal: signal() });

    expect(fetch).toHaveBeenCalledWith('/works/foo', expect.objectContaining({ headers: { accept: 'text/markdown' } }));
  });

  it('rejects another origin without fetching', async () => {
    const { fetch, toolNamed } = setup();
    for (const path of ['https://evil.example/', '//evil.example/', '/\\evil.example', 42]) {
      const result = await toolNamed('get_page_markdown').execute({ path }, { signal: signal() });
      expect(result.isError).toBe(true);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  // The older navigator.modelContext passed no options object with a signal.
  it('works without execute options', async () => {
    const { fetch, toolNamed } = setup();
    await toolNamed('get_page_markdown').execute({ path: '/blog' });

    expect(fetch).toHaveBeenCalledWith('/blog', { headers: { accept: 'text/markdown' }, signal: undefined });
  });
});

describe('navigate', () => {
  it('navigates to a site-relative path', async () => {
    const { navigate, toolNamed } = setup();
    const result = await toolNamed('navigate').execute({ path: '/works' }, { signal: signal() });

    expect(navigate).toHaveBeenCalledWith('/works');
    expect(result.isError).toBeUndefined();
  });

  it('refuses a missing path or another origin without navigating', async () => {
    const { navigate, toolNamed } = setup();
    for (const input of [{}, { path: '//evil.example/' }, { path: 'javascript:alert(1)' }, null]) {
      const result = await toolNamed('navigate').execute(input, { signal: signal() });
      expect(result.isError).toBe(true);
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it('requires path in its schema', () => {
    expect(setup().toolNamed('navigate').inputSchema.required).toEqual(['path']);
  });

  it('names every primary section plus contact and privacy in its description', () => {
    const { description } = setup().toolNamed('navigate');
    for (const href of [...siteNavItems.map((item) => item.href), '/contact', '/privacy']) {
      expect(description).toContain(href);
    }
  });
});

describe('list_entries', () => {
  it('offers the listing sections as an enum', () => {
    const { inputSchema } = setup().toolNamed('list_entries');
    expect(inputSchema.properties.section?.enum).toEqual([...LIST_SECTIONS]);
    expect(inputSchema.required).toEqual(['section']);
  });

  it('reads the Markdown of the section listing', async () => {
    const { fetch, toolNamed } = setup();
    const result = await toolNamed('list_entries').execute({ section: 'blog' }, { signal: signal() });

    expect(fetch).toHaveBeenCalledWith('/blog', expect.objectContaining({ headers: { accept: 'text/markdown' } }));
    expect(result).toEqual({ content: [{ type: 'text', text: '# md' }] });
  });

  it('rejects a section outside the enum without fetching', async () => {
    const { fetch, toolNamed } = setup();
    for (const input of [{}, { section: 'gallery' }, { section: '../admin' }]) {
      const result = await toolNamed('list_entries').execute(input, { signal: signal() });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('blog');
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  // Sync pair (.claude/rules/cross-module-sync-test.md): each section must have a
  // Markdown twin route, or the worker would answer the HTML listing.
  it('has a Markdown twin route for every section', () => {
    for (const section of LIST_SECTIONS) {
      expect(existsSync(new URL(`../../../pages/${section}.md.ts`, import.meta.url))).toBe(true);
    }
  });
});
