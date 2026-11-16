import { createGetPageMarkdownTool } from './get-page-markdown';
import { createListEntriesTool } from './list-entries';
import { createNavigateTool } from './navigate';

import type { WebMCPTool } from '../types';
import type { WebMCPToolDeps } from './deps';

export const createWebMCPTools = (deps: WebMCPToolDeps): readonly WebMCPTool[] => [createGetPageMarkdownTool(deps), createNavigateTool(deps), createListEntriesTool(deps)];
