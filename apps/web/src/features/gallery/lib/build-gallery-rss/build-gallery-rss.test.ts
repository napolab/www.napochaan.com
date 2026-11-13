import { describe, expect, it } from 'vitest';

import { buildGalleryRSS } from './index';

import type { GalleryPhoto } from '@components/gallery-archive';

const ORIGIN = 'https://napochaan.com';

const relative: GalleryPhoto = { id: 'g1', src: '/api/media/file/flyer.png', width: 800, height: 1200, alt: 'flyer & alt', caption: 'flyer / 04.24' };
const absolute: GalleryPhoto = { id: 'g2', src: 'https://cdn.example.com/a.webp', width: 1200, height: 800, alt: 'vrchat shot', caption: '' };

describe('buildGalleryRSS', () => {
  it('describes the gallery channel', () => {
    const xml = buildGalleryRSS([], ORIGIN);
    expect(xml).toContain('<title>napochaan — gallery</title>');
    expect(xml).toContain('<link>https://napochaan.com/gallery</link>');
    expect(xml).toContain('napochaan のギャラリー — flyer・VRChat・photo。');
    expect(xml).toContain('https://napochaan.com/gallery/rss.xml');
    expect(xml).not.toContain('<item>');
  });

  it('titles an item by its caption, falling back to alt when the caption is empty', () => {
    const xml = buildGalleryRSS([relative, absolute], ORIGIN);
    expect(xml).toContain('<title>flyer / 04.24</title>');
    expect(xml).toContain('<title>vrchat shot</title>');
    expect(xml).toContain('flyer &amp; alt');
  });

  it('links each item to its gallery anchor and absolutizes a relative enclosure', () => {
    const xml = buildGalleryRSS([relative, absolute], ORIGIN);
    expect(xml).toContain('<link>https://napochaan.com/gallery#g1</link>');
    expect(xml).toContain('https://napochaan.com/gallery#g2</guid>');
    expect(xml).toMatch(/<enclosure url="https:\/\/napochaan.com\/api\/media\/file\/flyer.png" [^>]*type="image\/png"/);
    expect(xml).toMatch(/<enclosure url="https:\/\/cdn.example.com\/a.webp" [^>]*type="image\/webp"/);
  });

  it('defaults an unknown extension to image/jpeg', () => {
    const xml = buildGalleryRSS([{ ...relative, src: '/x/photo' }], ORIGIN);
    expect(xml).toMatch(/type="image\/jpeg"/);
  });
});
