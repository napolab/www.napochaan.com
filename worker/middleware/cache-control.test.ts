import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { cacheControlHeaders, MEDIA_POLICY, PRIVATE_POLICY, resolveCacheControl, TEXT_FEED_POLICY } from './cache-control';

describe('resolveCacheControl', () => {
  it.each([
    ['/api/media/file/a.jpg', MEDIA_POLICY],
    ['/blog/rss.xml', TEXT_FEED_POLICY],
    ['/gallery/rss.xml', TEXT_FEED_POLICY],
    ['/llms.txt', TEXT_FEED_POLICY],
    ['/llms-full.txt', TEXT_FEED_POLICY],
    ['/blog/my-post.md', TEXT_FEED_POLICY],
    ['/about.md', TEXT_FEED_POLICY],
    ['/.well-known/security.txt', TEXT_FEED_POLICY],
    ['/api/users/me', PRIVATE_POLICY],
    ['/api/news', PRIVATE_POLICY],
    ['/api/mcp', PRIVATE_POLICY],
    ['/api/media/file/x.jpg', MEDIA_POLICY],
  ])('%s → %s', (path, expected) => {
    expect(resolveCacheControl(path)).toBe(expected);
  });

  it.each(['/', '/works', '/contact', '/admin', '/sitemap.xml', '/_next/image'])('leaves %s to the upstream policy', (path) => {
    expect(resolveCacheControl(path)).toBeUndefined();
  });
});

describe('cacheControlHeaders', () => {
  const build = (upstream: () => Response) => new Hono().use('*', cacheControlHeaders()).get('*', () => upstream());

  it('adds the policy when the upstream response has none', async () => {
    const app = build(() => new Response('xml'));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe(TEXT_FEED_POLICY);
  });

  it('never overrides an existing Cache-Control', async () => {
    const app = build(() => new Response('x', { headers: { 'Cache-Control': 'private, no-store' } }));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('skips responses that set cookies', async () => {
    const app = build(() => new Response('x', { headers: { 'Set-Cookie': 'a=b' } }));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  it('skips non-200 responses', async () => {
    const app = build(() => new Response('nope', { status: 404 }));
    const res = await app.request('/api/media/file/missing.jpg');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
