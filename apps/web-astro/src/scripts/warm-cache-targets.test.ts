import { describe, expect, it } from 'vitest';

import { buildWarmTargets, EXTRA_PATHS, parseSitemapLocations } from '../../scripts/warm-cache/targets.mjs';

describe('parseSitemapLocations', () => {
  it('extracts <loc> values, trimming surrounding whitespace', () => {
    const xml = `<urlset><url><loc>
      https://napochaan.com/
    </loc></url></urlset>`;
    expect(parseSitemapLocations(xml)).toEqual(['https://napochaan.com/']);
  });

  it('decodes XML entities in <loc> values', () => {
    const xml = '<urlset><url><loc>https://napochaan.com/blog?a=1&amp;b=2</loc></url></urlset>';
    expect(parseSitemapLocations(xml)).toEqual(['https://napochaan.com/blog?a=1&b=2']);
  });

  it('dedupes repeated <loc> values while keeping document order', () => {
    const xml = ['<urlset>', '<url><loc>https://napochaan.com/</loc></url>', '<url><loc>https://napochaan.com/about</loc></url>', '<url><loc>https://napochaan.com/</loc></url>', '</urlset>'].join('');
    expect(parseSitemapLocations(xml)).toEqual(['https://napochaan.com/', 'https://napochaan.com/about']);
  });

  it('returns an empty array for a sitemap with no <loc> entries', () => {
    expect(parseSitemapLocations('<urlset></urlset>')).toEqual([]);
  });
});

describe('buildWarmTargets', () => {
  const baseUrl = 'https://napochaan.com';

  it('appends EXTRA_PATHS after the sitemap locations', () => {
    const xml = '<urlset><url><loc>https://napochaan.com/</loc></url><url><loc>https://napochaan.com/about</loc></url></urlset>';
    const targets = buildWarmTargets(baseUrl, xml);
    expect(targets.slice(0, 2)).toEqual(['https://napochaan.com/', 'https://napochaan.com/about']);
    for (const path of EXTRA_PATHS) {
      expect(targets).toContain(`${baseUrl}${path}`);
    }
  });

  it('drops a foreign-origin <loc>', () => {
    const xml = '<urlset><url><loc>https://napochaan.com/</loc></url><url><loc>https://evil.example.com/phish</loc></url></urlset>';
    const targets = buildWarmTargets(baseUrl, xml);
    expect(targets).not.toContain('https://evil.example.com/phish');
    expect(targets).toContain('https://napochaan.com/');
  });

  it('does not duplicate an extra path the sitemap already lists', () => {
    const xml = `<urlset><url><loc>${baseUrl}/blog/rss.xml</loc></url></urlset>`;
    const targets = buildWarmTargets(baseUrl, xml);
    const occurrences = targets.filter((url) => url === `${baseUrl}/blog/rss.xml`);
    expect(occurrences).toHaveLength(1);
  });

  it('tolerates an empty sitemap and returns only the extras', () => {
    const targets = buildWarmTargets(baseUrl, '<urlset></urlset>');
    expect(targets).toEqual(EXTRA_PATHS.map((path) => `${baseUrl}${path}`));
  });
});
