import { fetchMarkdown } from '../fetch-markdown';
import { errorResult } from '../tool-result';
import { readField } from './read-field';

import type { WebMCPTool } from '../types';
import type { WebMCPToolDeps } from './deps';

// Listing pages with a Markdown twin (`src/pages/<section>.md.ts`); synced by tools.test.ts.
export const LIST_SECTIONS = ['blog', 'works', 'news', 'log'] as const;

type ListSection = (typeof LIST_SECTIONS)[number];

const isListSection = (value: unknown): value is ListSection => LIST_SECTIONS.some((section) => section === value);

export const createListEntriesTool = ({ fetch }: WebMCPToolDeps): WebMCPTool => ({
  name: 'list_entries',
  description: 'List the entries of a section of this site as Markdown (titles, dates and links): blog posts, works, news or the short log.',
  inputSchema: {
    type: 'object',
    properties: {
      section: { type: 'string', enum: LIST_SECTIONS, description: 'Which listing to read.' },
    },
    required: ['section'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  async execute(input, options) {
    const section = readField(input, 'section');
    if (!isListSection(section)) return errorResult(`Unknown section ${typeof section === 'string' ? JSON.stringify(section) : `(${typeof section})`}. Use one of: ${LIST_SECTIONS.join(' / ')}.`);

    return fetchMarkdown({ fetch, path: `/${section}`, signal: options?.signal });
  },
});
