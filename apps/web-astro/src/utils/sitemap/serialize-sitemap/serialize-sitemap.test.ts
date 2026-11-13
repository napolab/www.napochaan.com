import { describe, expect, it } from 'vitest';

import { serializeSitemap } from './index';

// Expected strings are Next's `resolveSitemap` (next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js) for the same entries.
describe('serializeSitemap', () => {
  it('serializes entries like Next (lastmod, changefreq, priority; optional fields omitted)', () => {
    expect(
      serializeSitemap([
        { url: 'https://napochaan.com', changeFrequency: 'weekly', priority: 1 },
        { url: 'https://napochaan.com/blog/a', lastModified: '2026-01-02', changeFrequency: 'monthly', priority: 0.6 },
        { url: 'https://napochaan.com/x' },
      ]),
    ).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '<url>',
        '<loc>https://napochaan.com</loc>',
        '<changefreq>weekly</changefreq>',
        '<priority>1</priority>',
        '</url>',
        '<url>',
        '<loc>https://napochaan.com/blog/a</loc>',
        '<lastmod>2026-01-02</lastmod>',
        '<changefreq>monthly</changefreq>',
        '<priority>0.6</priority>',
        '</url>',
        '<url>',
        '<loc>https://napochaan.com/x</loc>',
        '</url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('serializes an empty sitemap', () => {
    expect(serializeSitemap([])).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n');
  });
});
