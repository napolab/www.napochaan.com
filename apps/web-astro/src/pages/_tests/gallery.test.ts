import { describe, expect, it, vi } from 'vitest';

import GalleryPage from '../gallery.astro';
import * as rss from '../gallery/rss.xml';
import { ORIGIN, renderEndpoint, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

import type { GalleryPhoto } from '@components/gallery-archive';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const photos: readonly GalleryPhoto[] = [
  { id: 'g1', src: '/api/media/file/flyer.png', width: 800, height: 1200, alt: 'flyer alt', caption: 'flyer / 04.24' },
  { id: 'g2', src: '/api/media/file/shot.jpg', width: 1200, height: 800, alt: 'vrchat shot', caption: '' },
  { id: 'g3', src: '/api/media/file/photo.jpg', width: 1000, height: 1000, alt: 'photo alt' },
];

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/gallery', () => ({ findGalleryList: vi.fn(async () => photos) }));

const render = async (): Promise<string> => (await renderPage(GalleryPage, '/gallery')).text();

describe('/gallery', () => {
  // Live Next: the page set only `alternates.types`, so the root title / description /
  // card apply and no canonical is emitted.
  it('keeps the root title and links the feed without a canonical', async () => {
    const html = await render();
    expect(html).toContain('<title>napochaan</title>');
    expect(html).toContain('<meta name="description" content="napochaan の個人サイト。"');
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" href="http://localhost:8788/gallery/rss.xml" title="napochaan — gallery"');
    expect(html).not.toContain('rel="canonical"');
    expect(html).toContain('<meta property="og:image" content="http://localhost:8788/og-default.png"');
  });

  it('renders the header, the feed link and the labelled gallery section', async () => {
    const html = await render();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('まだ知らない君がいる！');
    expect(html).toContain('// flyer · VRChat · photo — 2024-2026');
    expect(html).toContain('href="/gallery/rss.xml"');
    expect(html).toContain('<section aria-label="作品ギャラリー一覧">');
  });

  it('server-renders every photo cell with its image and caption', async () => {
    const html = await render();
    expect(html.match(/<li [^>]*data-photo/g)).toHaveLength(3);
    expect(html).toContain('alt="flyer alt"');
    expect(html).toContain('flyer / 04.24');
  });

  it('hydrates only client leaves inside main (lightboxes and blank dimensions)', async () => {
    const islands = mainIslandsOf(await render());
    expect(islands.filter((name) => name === 'LightboxIsland')).toHaveLength(3);
    expect(islands).not.toContain('GalleryArchiveIsland');
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });
});

describe('/gallery/rss.xml', () => {
  it('serves the gallery feed', async () => {
    vi.stubEnv('BASE_URL', 'https://napochaan.com');
    const res = await renderEndpoint(rss as unknown as AstroComponentFactory, '/gallery/rss.xml');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(await res.text()).toContain('<link>https://napochaan.com/gallery#g1</link>');
  });
});
