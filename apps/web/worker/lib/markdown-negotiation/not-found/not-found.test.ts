import { describe, expect, it } from 'vitest';

import { markdownNotFoundResponse } from './index';

describe('markdownNotFoundResponse', () => {
  it('answers 404 as utf-8 markdown', () => {
    const res = markdownNotFoundResponse({ baseURL: 'https://napochaan.com', pathname: '/nope' });
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
  });

  it('names the missing path and links to absolute entry points', async () => {
    const body = await markdownNotFoundResponse({ baseURL: 'https://napochaan.com', pathname: '/nope' }).text();
    expect(body).toContain('# 404 Not Found');
    expect(body).toContain('`/nope`');
    expect(body).toContain('(https://napochaan.com/)');
    expect(body).toContain('(https://napochaan.com/blog)');
    expect(body).toContain('(https://napochaan.com/sitemap.xml)');
    expect(body).toContain('(https://napochaan.com/llms.txt)');
  });

  it('drops a trailing slash on the base URL', async () => {
    const body = await markdownNotFoundResponse({ baseURL: 'https://napochaan.com/', pathname: '/nope' }).text();
    expect(body).toContain('(https://napochaan.com/blog)');
    expect(body).not.toContain('https://napochaan.com//');
  });
});
