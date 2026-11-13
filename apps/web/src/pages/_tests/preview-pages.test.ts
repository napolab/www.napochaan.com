import { describe, expect, it, vi } from 'vitest';

import { blogFeed } from './blog-fixtures';
import { logManual, logPosts, logWorks } from './log-fixtures';
import { newsFeed } from './news-fixtures';
import { worksFeed } from './works-fixtures';
import NotFoundPage from '../404.astro';
import BlogPreviewPage from '../blog/preview/[id].astro';
import GalleryPreviewPage from '../gallery/preview.astro';
import LogPreviewPage from '../log/preview.astro';
import NewsPreviewPage from '../news/preview/[id].astro';
import WorksPreviewPage from '../works/preview/[id].astro';
import { createDraftCookieValue, DRAFT_COOKIE_NAME } from '../../lib/draft-mode';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf, mainLeafElementsOf } from '../../test-utils/island-parity';

import type { GalleryPhoto } from '@components/gallery-archive';
import type { LogManualItem } from '../../features/log/log-manual-item';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const SECRET = 'right';
const CMS_ORIGIN = 'https://cms.napochaan.com';

const env = vi.hoisted(() => ({ current: { PREVIEW_SECRET: 'right', CMS_ORIGIN: 'https://cms.napochaan.com' } as Partial<Cloudflare.Env> }));

// Drafts are only handed out for the configured secret, as the cms gates them.
const drafts = vi.hoisted(() => ({
  byId:
    <T extends { id: string }>(feed: () => readonly T[]) =>
    async (id: string, previewSecret: string): Promise<T | undefined> =>
      previewSecret === 'right' ? feed().find((entry) => entry.id === id) : undefined,
  photos: [{ id: 'g9', src: '/api/media/file/draft.png', width: 800, height: 1200, alt: 'draft photo' }] satisfies readonly GalleryPhoto[],
  logs: [{ id: 'l9', title: 'draft gig', date: '2025-02-02', meta: 'draft' }] satisfies readonly LogManualItem[],
}));

vi.mock('@lib/request-context', () => ({ getRequestContext: () => ({ env: env.current }) }));
vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/blog', () => ({ findBlogList: vi.fn(async () => blogFeed), findBlogDraftById: vi.fn(drafts.byId(() => blogFeed)) }));
vi.mock('@lib/cms/news', () => ({ findNewsList: vi.fn(async () => newsFeed), findNewsDraftById: vi.fn(drafts.byId(() => newsFeed)) }));
vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => worksFeed), findWorkDraftById: vi.fn(drafts.byId(() => worksFeed)) }));
vi.mock('@lib/cms/gallery', () => ({ findGalleryDraftList: vi.fn(async (secret: string) => (secret === 'right' ? drafts.photos : [])) }));
vi.mock('@lib/cms/logs', () => ({ findLogList: vi.fn(async () => logManual), findLogDraftList: vi.fn(async (secret: string) => (secret === 'right' ? drafts.logs : [])) }));
vi.mock('../../features/log/lib/fetch-external-posts', () => ({ fetchExternalPosts: vi.fn(async () => logPosts) }));

type Case = { name: string; page: AstroComponentFactory; pathname: string; params: Record<string, string>; draftText: string };

const cases: readonly Case[] = [
  { name: 'blog', page: BlogPreviewPage, pathname: '/blog/preview/20', params: { id: '20' }, draftText: 'Dotted Post' },
  { name: 'news', page: NewsPreviewPage, pathname: '/news/preview/30', params: { id: '30' }, draftText: 'Dotted News' },
  { name: 'works', page: WorksPreviewPage, pathname: '/works/preview/100', params: { id: '100' }, draftText: 'Dotted Work' },
  { name: 'gallery', page: GalleryPreviewPage, pathname: '/gallery/preview', params: {}, draftText: 'draft photo' },
  { name: 'log', page: LogPreviewPage, pathname: '/log/preview', params: {}, draftText: 'draft gig' },
];

const draftCookie = async (secret = SECRET) => `${DRAFT_COOKIE_NAME}=${await createDraftCookieValue(secret)}`;

const render = async ({ page, pathname, params }: Case, cookie?: string): Promise<Response> => {
  vi.stubEnv('BASE_URL', 'https://napochaan.com');
  const headers = cookie === undefined ? undefined : { cookie };

  return renderPage(page, pathname, { '/404': NotFoundPage }, params, { headers });
};

describe.each(cases)('$pathname (draft preview)', (testCase) => {
  it('is a 404 without the draft cookie, so drafts never leak', async () => {
    const res = await render(testCase);
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain(testCase.draftText);
  });

  it('is a 404 with a cookie minted for another secret', async () => {
    const res = await render(testCase, await draftCookie('wrong'));
    expect(res.status).toBe(404);
  });

  it('is a 404 when PREVIEW_SECRET is unset, even with a cookie', async () => {
    env.current = { CMS_ORIGIN };
    const res = await render(testCase, await draftCookie());
    env.current = { PREVIEW_SECRET: SECRET, CMS_ORIGIN };
    expect(res.status).toBe(404);
  });

  it('renders the draft with the cookie, inside one main with one h1', async () => {
    const res = await render(testCase, await draftCookie());
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(testCase.draftText);
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it('mounts the Live Preview listener for CMS_ORIGIN and hydrates only client leaves', async () => {
    const html = await (await render(testCase, await draftCookie())).text();
    const islands = mainIslandsOf(html);
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
    expect(islands.filter((name) => name === 'LivePreviewIsland')).toHaveLength(1);
    expect(html).toContain('&quot;serverURL&quot;:[0,&quot;https://cms.napochaan.com&quot;]');
  });

  // RefreshRouteOnSave calls refresh() on mount. A refresh is a ClientRouter swap, so a
  // non-persisted listener would remount on the new page and refresh again — forever
  // (seen under wrangler dev: 22 page fetches in 5 s). Persisted, it mounts once.
  it('persists the Live Preview listener across its own refresh swaps', async () => {
    const html = await (await render(testCase, await draftCookie())).text();
    expect(html).toMatch(/<astro-island [^>]*component-export="LivePreviewIsland"[^>]*data-astro-transition-persist="live-preview"/);
  });

  it('keeps the root metadata (the Next preview routes set none)', async () => {
    const html = await (await render(testCase, await draftCookie())).text();
    expect(html).toContain('<title>napochaan</title>');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788"');
  });
});

describe('detail previews', () => {
  it('404s an unknown draft id', async () => {
    const [blog] = cases;
    if (blog === undefined) throw new Error('missing case');
    const res = await render({ ...blog, pathname: '/blog/preview/nope', params: { id: 'nope' } }, await draftCookie());
    expect(res.status).toBe(404);
  });

  it('blog: plain body (no QuoteShare / ShareBar), TOC and published neighbours', async () => {
    const html = await (await render(cases[0] as Case, await draftCookie())).text();
    expect(mainIslandsOf(html)).not.toContain('QuoteShareIsland');
    expect(mainLeafElementsOf(html)).not.toContain('share-bar');
    expect(html).not.toContain('data-toc-scope');
    expect(html).toMatch(/<nav [^>]*aria-label="目次"/);
    expect(html).toContain('href="/blog/post-11"');
  });

  it('news: the NewsDetail body with its share bar', async () => {
    const html = await (await render(cases[1] as Case, await draftCookie())).text();
    expect(mainLeafElementsOf(html).filter((tag) => tag === 'share-bar')).toHaveLength(1);
  });

  it('works: no ShareBar, related works and adjacent nav', async () => {
    const html = await (await render(cases[2] as Case, await draftCookie())).text();
    const islands = mainIslandsOf(html);
    expect(mainLeafElementsOf(html)).not.toContain('share-bar');
    expect(html).toContain('related / 関連');
    expect(html).toMatch(/<nav [^>]*aria-label="works pagination"/);
  });

  it('log: the layout chrome (header, calendar from published logs, feed link) around the draft timeline', async () => {
    const html = await (await render(cases[4] as Case, await draftCookie())).text();
    expect(html).toContain('進捗どうですか？');
    expect(html).toContain('href="/log/rss.xml"');
    expect(mainIslandsOf(html)).toContain('LogCalendarIsland');
    expect(html).not.toContain('future gig');
  });
});
