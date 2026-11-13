import { readdir } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { buildProbes, FIXED_PROBES, OG_IMAGE_SUFFIXES, pickSectionSlugs, SECTIONS, sitemapPaths } from '../../scripts/parity-urls.mjs';

describe('pickSectionSlugs', () => {
  const paths = ['/blog', '/blog/x', '/blog/a.b', '/blog/y', '/blog/z', '/blog/page/2', '/news/n'];

  it('picks the dotted slug plus the first two plain slugs of the section', () => {
    expect(pickSectionSlugs(paths, 'blog')).toEqual(['a.b', 'x', 'y']);
  });

  it('only looks at direct children of the section', () => {
    expect(pickSectionSlugs(paths, 'news')).toEqual(['n']);
    expect(pickSectionSlugs(paths, 'works')).toEqual([]);
  });
});

describe('sitemapPaths', () => {
  it('strips the origin', () => {
    expect(sitemapPaths(['https://napochaan.com/blog/a.b', 'http://localhost:3000'])).toEqual(['/blog/a.b', '/']);
  });
});

describe('buildProbes', () => {
  it('adds page, .md and OG probes for each discovered slug', () => {
    const probes = buildProbes({ blog: ['a.b'], news: [], works: [] });
    expect(probes.slice(FIXED_PROBES.length).map((probe) => probe.path)).toEqual(['/blog/a.b', '/blog/a.b.md', `/blog/a.b/opengraph-image-${OG_IMAGE_SUFFIXES.blog}`, '/blog/a.b/md']);
  });

  it('expects a status for every probe', () => {
    for (const probe of buildProbes({ blog: ['a'], news: ['b'], works: ['c'] })) expect(probe.expect).toBeTypeOf('number');
  });
});

// Cross-module sync: the OG suffixes must be the literal route filenames.
describe('OG_IMAGE_SUFFIXES', () => {
  it.each(SECTIONS)('%s matches src/pages/<section>/[slug]/opengraph-image-<suffix>.ts', async (section) => {
    const files = await readdir(new URL(`../pages/${section}/[slug]/`, import.meta.url));
    expect(files).toContain(`opengraph-image-${OG_IMAGE_SUFFIXES[section as keyof typeof OG_IMAGE_SUFFIXES]}.ts`);
  });
});
