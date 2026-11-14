import { markdownNotFoundResponse } from '../../../lib/markdown-negotiation/not-found';
import { resolveMarkdownTwinPath } from '../../../lib/markdown-negotiation/twin-path';

export type Render = (request: Request) => Promise<Response>;

type NegotiateArgs = { request: Request; render: Render; baseURL: string };

// `.md` twins send text/markdown; `/llms.txt` (the home page's twin) sends text/plain.
const TWIN_MEDIA_TYPES = ['text/markdown', 'text/plain'];

const mediaTypeOf = (response: Response): string => (response.headers.get('Content-Type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';

// A 200 of another type (e.g. a dynamic route that took `2.md` as a param and rendered
// HTML) is not a Markdown twin.
const isMarkdownTwin = (response: Response): boolean => response.status === 200 && TWIN_MEDIA_TYPES.includes(mediaTypeOf(response));

// Checked after isMarkdownTwin: a 404, or a 200 that rendered something else, means
// the page has no twin. Any other status (a 5xx render failure) is the answer itself.
const isMissingTwin = (response: Response): boolean => response.status === 404 || response.status === 200;

const asMarkdown = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Same method / headers, path swapped for the twin; the query string is kept.
const toTwinRequest = (request: Request): Request => {
  const url = new URL(request.url);
  url.pathname = resolveMarkdownTwinPath(url.pathname);

  return new Request(url, request);
};

const discard = async (response: Response): Promise<void> => {
  await response.body?.cancel();
};

// Markdown at the page URL: the `.md` twin when there is one, else the HTML page (pages
// without a twin: gallery, contact, colophon, `/blog/page/N`), else a Markdown 404.
// A twin error other than 404 (a 5xx from a failed render) is served as is.
export const renderMarkdownPreferred = async ({ request, render, baseURL }: NegotiateArgs): Promise<Response> => {
  const twin = await render(toTwinRequest(request));
  if (isMarkdownTwin(twin)) return asMarkdown(twin);
  if (!isMissingTwin(twin)) return twin;
  await discard(twin);

  const page = await render(request);
  if (page.status !== 404) return page;
  await discard(page);

  return markdownNotFoundResponse({ baseURL, pathname: new URL(request.url).pathname });
};
