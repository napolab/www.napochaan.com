import { readFile } from 'node:fs/promises';

import { describe, expect, it, vi } from 'vitest';

import { findWorkFixture, worksFeed } from './works-fixtures';
import * as worksMarkdown from '../works.md';
import * as workMarkdown from '../works/[slug].md';
import * as ogImage from '../works/[slug]/opengraph-image-apsyht';
import * as rss from '../works/rss.xml';
import { buildWorkMarkdown } from '../../features/works/lib/build-work-markdown';
import { buildWorksIndexMarkdown } from '../../features/works/lib/build-works-index-markdown';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { OgAssets } from '@utils/og/load-og-assets';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const findWorkBySlug = vi.hoisted(() => vi.fn<(slug: string) => Promise<unknown>>());

vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => worksFeed), findWorkBySlug }));
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

findWorkBySlug.mockImplementation(findWorkFixture);

describe('/works.md', () => {
  it('serves the index markdown', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(worksMarkdown), '/works.md');
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe(buildWorksIndexMarkdown(worksFeed, BASE));
  });
});

// The container calls the endpoint with the params the router would extract; routing
// `/works/a.b.md` → `[slug].md.ts` (slug `a.b`) is verified through the built worker
// (see blog-endpoints.test.ts and the Task 6 report's curl matrix).
describe('/works/[slug].md', () => {
  it('resolves a dotted slug (a.b) and serves its markdown', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(workMarkdown), '/works/a.b.md', { slug: 'a.b' });
    expect(findWorkBySlug).toHaveBeenLastCalledWith('a.b');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const [dotted] = worksFeed;
    expect(dotted).toBeDefined();
    if (dotted === undefined) return;
    expect(await res.text()).toBe(buildWorkMarkdown(dotted, BASE));
  });

  it('answers a plain-text 404 for an unknown slug', async () => {
    const res = await renderEndpoint(endpoint(workMarkdown), '/works/x.md', { slug: 'x' });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });
});

describe('/works/rss.xml', () => {
  it('serves RSS with a charset', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(rss), '/works/rss.xml');
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(await res.text()).toContain(`<link>${BASE}/works/a.b</link>`);
  });
});

const ihdrSize = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { chunk: new TextDecoder().decode(bytes.slice(12, 16)), width: view.getUint32(16), height: view.getUint32(20) };
};

describe('/works/[slug]/opengraph-image-apsyht', () => {
  it.each(['a.b', 'missing'])('returns a 1200x630 PNG for %s (an unknown slug still gets the generic card)', async (slug) => {
    const res = await renderEndpoint(endpoint(ogImage), `/works/${slug}/opengraph-image-apsyht`, { slug });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(ihdrSize(new Uint8Array(await res.arrayBuffer()))).toEqual({ chunk: 'IHDR', width: 1200, height: 630 });
  });
});
