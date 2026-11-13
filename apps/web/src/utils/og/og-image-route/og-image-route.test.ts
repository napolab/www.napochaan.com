import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { OG_IMAGE_ROUTE_SUFFIX, ogImageEntry, ogImagePath } from './index';

const routeFile = (section: string, suffix: string): URL => new URL(`../../../pages/${section}/[slug]/opengraph-image-${suffix}.ts`, import.meta.url);

describe('ogImagePath', () => {
  it('reproduces the Next file-convention path of the blog card', () => {
    expect(ogImagePath('blog', 'cannelloni-vj-tools')).toBe('/blog/cannelloni-vj-tools/opengraph-image-fx5gi7');
  });

  it('describes the card as a 1200x630 png', () => {
    expect(ogImageEntry('blog', 'a')).toEqual({ url: '/blog/a/opengraph-image-fx5gi7', type: 'image/png', width: 1200, height: 630 });
  });

  // The route filenames are literals; this keeps them in sync with the suffix table.
  // Derived from the table itself (.claude/rules/cross-module-sync-test.md), so adding a
  // section without its route file fails here.
  it.each(Object.entries(OG_IMAGE_ROUTE_SUFFIX))('has a route file for the %s suffix (%s)', (section, suffix) => {
    expect(existsSync(routeFile(section, suffix))).toBe(true);
  });
});
