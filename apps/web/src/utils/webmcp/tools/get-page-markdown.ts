import { fetchMarkdown } from '../fetch-markdown';
import { resolveSitePath } from '../site-path';
import { errorResult } from '../tool-result';
import { readField } from './read-field';

import type { WebMCPTool } from '../types';
import type { WebMCPToolDeps } from './deps';

export const createGetPageMarkdownTool = ({ fetch, getPathname, origin }: WebMCPToolDeps): WebMCPTool => ({
  name: 'get_page_markdown',
  description: 'Get the Markdown version of a page on this site (napochaan.com, the portfolio and blog of napochaan). Defaults to the page currently open. "/" returns the site index (llms.txt).',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Site-relative path starting with "/", e.g. "/about" or "/blog/<slug>". Omit for the current page.' },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input, options) {
    const requested = readField(input, 'path') ?? getPathname();
    const resolved = resolveSitePath(requested, origin);
    if (!resolved.ok) return errorResult(resolved.reason);

    return fetchMarkdown({ fetch, path: resolved.path, signal: options?.signal });
  },
});
