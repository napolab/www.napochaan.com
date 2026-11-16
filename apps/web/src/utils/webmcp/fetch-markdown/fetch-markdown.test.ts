import { describe, expect, it, vi } from 'vitest';

import { fetchMarkdown } from './index';

const respond = (body: string, init: ResponseInit) => vi.fn(async (_input: string, _init: RequestInit) => new Response(body, init));

const markdown = (body: string) => respond(body, { status: 200, headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });

describe('fetchMarkdown', () => {
  it('requests the path with Accept: text/markdown and forwards the abort signal', async () => {
    const fetch = markdown('# blog');
    const { signal } = new AbortController();

    await fetchMarkdown({ fetch, path: '/blog', signal });

    expect(fetch).toHaveBeenCalledWith('/blog', { headers: { accept: 'text/markdown' }, signal });
  });

  it('returns the Markdown body as a text content result', async () => {
    const result = await fetchMarkdown({ fetch: markdown('# blog\n'), path: '/blog', signal: new AbortController().signal });

    expect(result).toEqual({ content: [{ type: 'text', text: '# blog\n' }] });
  });

  // `/` negotiates to /llms.txt, and an explicit `/llms.txt` answers text/plain.
  it('accepts a text/plain body (llms.txt is Markdown served as plain text)', async () => {
    const fetch = respond('# napochaan', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    const result = await fetchMarkdown({ fetch, path: '/llms.txt', signal: new AbortController().signal });

    expect(result).toEqual({ content: [{ type: 'text', text: '# napochaan' }] });
  });

  it('reports a non-OK response as a tool error carrying the status, not the body', async () => {
    const fetch = respond('# not found', { status: 404, statusText: 'Not Found', headers: { 'Content-Type': 'text/markdown' } });
    const result = await fetchMarkdown({ fetch, path: '/blog/missing', signal: new AbortController().signal });

    expect(result).toEqual({ isError: true, content: [{ type: 'text', text: expect.stringContaining('404') }] });
    expect(result.content[0].text).toContain('/blog/missing');
    expect(result.content[0].text).not.toContain('# not found');
  });

  // Twinless pages (gallery, contact, colophon) fall back to the HTML page.
  it('reports a page without a Markdown representation as a tool error', async () => {
    const fetch = respond('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    const result = await fetchMarkdown({ fetch, path: '/gallery', signal: new AbortController().signal });

    expect(result).toEqual({ isError: true, content: [{ type: 'text', text: expect.stringContaining('text/html') }] });
    expect(result.content[0].text).not.toContain('<html>');
  });
});
