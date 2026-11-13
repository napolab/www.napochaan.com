import { readFile } from 'node:fs/promises';

import { describe, expect, it, vi } from 'vitest';

import { blogFeed } from './blog-fixtures';
import * as blogMarkdown from '../blog.md';
import * as postMarkdown from '../blog/[slug].md';
import * as ogImage from '../blog/[slug]/opengraph-image-fx5gi7';
import * as rss from '../blog/rss.xml';
import { buildBlogIndexMarkdown } from '../../features/blog/lib/build-blog-index-markdown';
import { buildPostMarkdown } from '../../features/blog/lib/build-post-markdown';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { Post } from '../../features/blog/post';
import type { OgAssets } from '@utils/og/load-og-assets';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const findBlogBySlug = vi.hoisted(() => vi.fn(async (slug: string): Promise<Post | undefined> => blogFeed.find((post) => post.slug === slug)));

vi.mock('@lib/cms/blog', () => ({ findBlogList: vi.fn(async () => blogFeed), findBlogBySlug }));
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

describe('/blog.md', () => {
  it('serves the index markdown', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(blogMarkdown), '/blog.md');
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe(buildBlogIndexMarkdown(blogFeed, BASE));
  });
});

describe('/blog/[slug].md', () => {
  it('resolves a dotted slug (a.b) and serves its markdown', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(postMarkdown), '/blog/a.b.md', { slug: 'a.b' });
    expect(findBlogBySlug).toHaveBeenLastCalledWith('a.b');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const [dotted] = blogFeed;
    expect(dotted).toBeDefined();
    if (dotted === undefined) return;
    expect(await res.text()).toBe(buildPostMarkdown(dotted, BASE));
  });

  it('answers a plain-text 404 for an unknown slug', async () => {
    const res = await renderEndpoint(endpoint(postMarkdown), '/blog/x.md', { slug: 'x' });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });
});

describe('/blog/rss.xml', () => {
  it('serves RSS with a charset', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(rss), '/blog/rss.xml');
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(await res.text()).toContain(`<link>${BASE}/blog/a.b</link>`);
  });
});

const ihdrSize = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { chunk: new TextDecoder().decode(bytes.slice(12, 16)), width: view.getUint32(16), height: view.getUint32(20) };
};

describe('/blog/[slug]/opengraph-image-fx5gi7', () => {
  it.each(['a.b', 'missing'])('returns a 1200x630 PNG for %s (an unknown slug still gets the generic card)', async (slug) => {
    const res = await renderEndpoint(endpoint(ogImage), `/blog/${slug}/opengraph-image-fx5gi7`, { slug });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(ihdrSize(new Uint8Array(await res.arrayBuffer()))).toEqual({ chunk: 'IHDR', width: 1200, height: 630 });
  });
});
