import { describe, expect, it } from 'vitest';

import { buildRobots } from '../build-robots';
import { serializeRobots } from './index';

// Expected strings are Next's `resolveRobots` (next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js) applied to the same buildRobots output.
describe('serializeRobots', () => {
  it('serializes the production rules and sitemap like Next', () => {
    expect(serializeRobots(buildRobots({ baseUrl: 'https://napochaan.com', isProduction: true }))).toBe(
      [
        'User-Agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api',
        'Disallow: /next/',
        'Disallow: /news/preview/',
        'Disallow: /blog/preview/',
        'Disallow: /works/preview/',
        'Disallow: /gallery/preview',
        'Disallow: /log/preview',
        '',
        'Sitemap: https://napochaan.com/sitemap.xml',
        '',
      ].join('\n'),
    );
  });

  it('blocks everything on non-production hosts, with no sitemap', () => {
    expect(serializeRobots(buildRobots({ baseUrl: 'https://stg.napochaan.com', isProduction: false }))).toBe('User-Agent: *\nDisallow: /\n\n');
  });

  it('defaults a missing user agent to * and handles several rules', () => {
    expect(
      serializeRobots({
        rules: [
          { userAgent: 'a', disallow: '/x' },
          { userAgent: '', allow: ['/y', '/z'] },
        ],
      }),
    ).toBe('User-Agent: a\nDisallow: /x\n\nUser-Agent: *\nAllow: /y\nAllow: /z\n\n');
  });
});
