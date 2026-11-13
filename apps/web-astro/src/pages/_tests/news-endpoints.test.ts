import { readFile } from 'node:fs/promises';

import { describe, expect, it, vi } from 'vitest';

import { findNewsFixture, newsFeed } from './news-fixtures';
import * as newsMarkdown from '../news.md';
import * as itemMarkdown from '../news/[slug].md';
import * as ogImage from '../news/[slug]/opengraph-image-5nvrt4';
import * as rss from '../news/rss.xml';
import { buildNewsIndexMarkdown } from '../../features/news/lib/build-news-index-markdown';
import { buildNewsItemMarkdown } from '../../features/news/lib/build-news-item-markdown';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { OgAssets } from '@utils/og/load-og-assets';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const findNewsBySlug = vi.hoisted(() => vi.fn<(slug: string) => Promise<unknown>>());

vi.mock('@lib/cms/news', () => ({ findNewsList: vi.fn(async () => newsFeed), findNewsBySlug }));
vi.mock('@utils/og/og-image-url', () => ({ requestOrigin: async () => 'http://localhost:8788' }));
// The thumbnail would be read over the CMS binding; the text card is enough here.
vi.mock('@utils/og/load-og-image', () => ({ loadOgImage: async () => undefined }));
vi.mock('@utils/og/load-og-assets', () => ({
  loadOgAssets: async (): Promise<OgAssets> => {
    const file = async (name: string) => new Uint8Array(await readFile(new URL(`../../../public/og/${name}`, import.meta.url))).buffer;
    return {
      fonts: [
        { name: 'LINE Seed JP', data: await file('LINESeedJP-Bold.otf'), weight: 700, style: 'normal' },
        { name: 'Geist Mono', data: await file('GeistMono-subset.ttf'), weight: 400, style: 'normal' },
      ],
      wordmarkUrl: `data:image/png;base64,${Buffer.from(await file('wordmark.png')).toString('base64')}`,
    };
  },
}));
vi.mock('@utils/og/wasm', async () => {
  const { createRequire } = await import('node:module');
  const resolve = createRequire(import.meta.url).resolve;
  const compile = async (specifier: string) => WebAssembly.compile(await readFile(resolve(specifier)));
  return { OG_WASM: { yoga: await compile('satori/yoga.wasm'), resvg: await compile('@resvg/resvg-wasm/index_bg.wasm') } };
});

const endpoint = (module: unknown) => module as AstroComponentFactory;
const BASE = 'https://napochaan.com';

findNewsBySlug.mockImplementation(findNewsFixture);

describe('/news.md', () => {
  it('serves the index markdown (external items link off-site)', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(newsMarkdown), '/news.md');
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const body = await res.text();
    expect(body).toBe(buildNewsIndexMarkdown(newsFeed, BASE));
    expect(body).toContain('(https://x.com/naporin24690/status/1)');
  });
});

// The container calls the endpoint with the params the router would extract; routing
// `/news/a.b.md` → `[slug].md.ts` (slug `a.b`) is verified through the built worker
// (see blog-endpoints.test.ts and the Task 6 report's curl matrix).
describe('/news/[slug].md', () => {
  it('resolves a dotted slug (a.b) and serves its markdown', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(itemMarkdown), '/news/a.b.md', { slug: 'a.b' });
    expect(findNewsBySlug).toHaveBeenLastCalledWith('a.b');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const [dotted] = newsFeed;
    expect(dotted).toBeDefined();
    if (dotted === undefined) return;
    expect(await res.text()).toBe(buildNewsItemMarkdown(dotted, BASE));
  });

  it.each(['x', 'ext-item'])('answers a plain-text 404 for %s (unknown / external)', async (slug) => {
    const res = await renderEndpoint(endpoint(itemMarkdown), `/news/${slug}.md`, { slug });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });
});

describe('/news/rss.xml', () => {
  it('serves RSS with a charset', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(rss), '/news/rss.xml');
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    const xml = await res.text();
    expect(xml).toContain(`<link>${BASE}/news/a.b</link>`);
    expect(xml).toContain('<link>https://x.com/naporin24690/status/1</link>');
  });
});

const ihdrSize = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { chunk: new TextDecoder().decode(bytes.slice(12, 16)), width: view.getUint32(16), height: view.getUint32(20) };
};

describe('/news/[slug]/opengraph-image-5nvrt4', () => {
  it.each(['a.b', 'missing'])('returns a 1200x630 PNG for %s (an unknown slug still gets the generic card)', async (slug) => {
    const res = await renderEndpoint(endpoint(ogImage), `/news/${slug}/opengraph-image-5nvrt4`, { slug });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(ihdrSize(new Uint8Array(await res.arrayBuffer()))).toEqual({ chunk: 'IHDR', width: 1200, height: 630 });
  });

  it('answers 404 for an external item (it has no public surface)', async () => {
    const res = await renderEndpoint(endpoint(ogImage), '/news/ext-item/opengraph-image-5nvrt4', { slug: 'ext-item' });
    expect(res.status).toBe(404);
  });
});
