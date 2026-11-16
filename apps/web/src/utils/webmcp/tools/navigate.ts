import { siteNavItems } from '@utils/nav-items';

import { resolveSitePath } from '../site-path';
import { errorResult, textResult } from '../tool-result';
import { readField } from './read-field';

import type { WebMCPTool } from '../types';
import type { WebMCPToolDeps } from './deps';

// The primary nav plus the footer-only pages.
const SECTION_PATHS: readonly string[] = [...siteNavItems.map((item) => item.href), '/contact', '/privacy'];

export const createNavigateTool = ({ navigate, origin }: WebMCPToolDeps): WebMCPTool => ({
  name: 'navigate',
  description: `Open a page of this site in the current tab. Main sections: ${SECTION_PATHS.join(', ')}. Entries live under /blog/<slug>, /works/<slug> and /news/<slug>.`,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Site-relative path starting with "/", e.g. "/works".' },
    },
    required: ['path'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
  async execute(input) {
    const resolved = resolveSitePath(readField(input, 'path'), origin);
    if (!resolved.ok) return errorResult(resolved.reason);

    navigate(resolved.path);

    return textResult(`Navigating to ${resolved.path}`);
  },
});
