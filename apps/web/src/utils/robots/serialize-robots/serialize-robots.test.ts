import { describe, expect, it } from 'vitest';

import { buildRobots } from '../build-robots';
import { serializeRobots } from './index';

const PRIVATE_PATH_LINES = [
  'Disallow: /admin',
  'Disallow: /api',
  'Disallow: /next/',
  'Disallow: /news/preview/',
  'Disallow: /blog/preview/',
  'Disallow: /works/preview/',
  'Disallow: /gallery/preview',
  'Disallow: /log/preview',
];

const allowedGroup = (userAgent: string): string[] => [`User-Agent: ${userAgent}`, 'Content-Signal: search=yes,ai-train=no,use=reference', 'Allow: /', ...PRIVATE_PATH_LINES, ''];

const TRAINING_CRAWLERS = [
  'Amazonbot',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'ClaudeBot',
  'Diffbot',
  'Google-Extended',
  'GPTBot',
  'omgili',
  'anthropic-ai',
  'Claude-Web',
  'cohere-ai',
  'MistralAI-Training',
  'meta-externalagent',
  'GoogleOther',
  'Baiduspider',
  'PetalBot',
  'AwarioSmartBot',
  'AwarioRssBot',
  'Google-CloudVertexBot',
  'QualifiedBot',
  'Cotoyogi',
  'ICC-Crawler',
  'atlassian-bot',
  'FishBot',
  'BorderxBot',
  'NavuBot',
  'SemrushBot-SWA',
  'WARDBot',
  'magpie-crawler',
  'KimiBot',
  'CitibotSiteCrawler',
];

describe('serializeRobots', () => {
  it('serializes the production groups (site, AI search, AI training) and the sitemap', () => {
    expect(serializeRobots(buildRobots({ baseUrl: 'https://napochaan.com', isProduction: true }))).toBe(
      [
        ...allowedGroup('*'),
        ...allowedGroup('OAI-SearchBot'),
        ...allowedGroup('Claude-SearchBot'),
        ...allowedGroup('PerplexityBot'),
        ...TRAINING_CRAWLERS.map((agent) => `User-Agent: ${agent}`),
        'Disallow: /',
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

  it('writes one User-Agent line per agent when a group lists several', () => {
    expect(serializeRobots({ rules: { userAgent: ['a', 'b'], disallow: '/' } })).toBe('User-Agent: a\nUser-Agent: b\nDisallow: /\n\n');
  });

  it('puts Content-Signal right after the User-Agent lines, before Allow / Disallow', () => {
    expect(serializeRobots({ rules: { userAgent: '*', contentSignal: 'search=yes', allow: '/', disallow: '/x' } })).toBe('User-Agent: *\nContent-Signal: search=yes\nAllow: /\nDisallow: /x\n\n');
  });
});
