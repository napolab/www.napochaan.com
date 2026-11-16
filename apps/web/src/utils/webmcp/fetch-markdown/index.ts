import { errorResult, textResult } from '../tool-result';

import type { ToolResult } from '../tool-result';

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

type FetchMarkdownArgs = { fetch: FetchLike; path: string; signal: AbortSignal | undefined };

// The worker answers `Accept: text/markdown` with the page's `.md` twin as text/markdown
// (`/` → llms.txt). A page without a twin falls back to its HTML, which is not Markdown.
const MARKDOWN_MEDIA_TYPES: readonly string[] = ['text/markdown', 'text/plain'];

const mediaTypeOf = (response: Response): string => (response.headers.get('Content-Type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';

const discard = async (response: Response): Promise<void> => {
  await response.body?.cancel();
};

export const fetchMarkdown = async ({ fetch, path, signal }: FetchMarkdownArgs): Promise<ToolResult> => {
  const response = await fetch(path, { headers: { accept: 'text/markdown' }, signal });
  if (!response.ok) {
    await discard(response);
    return errorResult(`GET ${path} failed with HTTP ${response.status} ${response.statusText}`.trim());
  }

  const mediaType = mediaTypeOf(response);
  if (!MARKDOWN_MEDIA_TYPES.includes(mediaType)) {
    await discard(response);
    return errorResult(`${path} has no Markdown representation (the server answered ${mediaType || 'an unknown type'}).`);
  }

  return textResult(await response.text());
};
