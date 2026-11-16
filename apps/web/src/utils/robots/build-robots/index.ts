import type { Robots, RobotsRule } from '../types';

type BuildRobotsArgs = {
  baseUrl: string;
  isProduction: boolean;
};

// Non-public segments crawlers must never index, even in production.
export const DISALLOWED_PATHS = ['/admin', '/api', '/next/', '/news/preview/', '/blog/preview/', '/works/preview/', '/gallery/preview', '/log/preview'] as const;

// Content Signals (https://contentsignals.org/): appear in search, no model training,
// may be used as a cited reference. The policy Cloudflare's Bot Preference Sync used to
// prepend before the site owner turned it off.
export const CONTENT_SIGNAL = 'search=yes,ai-train=no,use=reference';

// AI search crawlers stay allowed. Each needs its own group: a crawler that matches a
// named group ignores `*`, so the private-path disallows are repeated there.
export const AI_SEARCH_CRAWLERS = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'] as const;

// AI training crawlers are blocked site-wide (the list Cloudflare's managed block used).
export const AI_TRAINING_CRAWLERS = [
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
] as const;

const blockEverything = (): Robots => ({ rules: { userAgent: '*', disallow: '/' } });

const allowedSiteRule = (userAgent: string): RobotsRule => ({ userAgent, contentSignal: CONTENT_SIGNAL, allow: '/', disallow: [...DISALLOWED_PATHS] });

const blockedTrainingRule = (): RobotsRule => ({ userAgent: [...AI_TRAINING_CRAWLERS], disallow: '/' });

const productionRobots = (baseUrl: string): Robots => ({
  rules: [allowedSiteRule('*'), ...AI_SEARCH_CRAWLERS.map(allowedSiteRule), blockedTrainingRule()],
  sitemap: `${baseUrl}/sitemap.xml`,
});

// Non-production hosts (preview/local) block the whole site so staging never gets
// indexed, and they expose no sitemap.
export const buildRobots = ({ baseUrl, isProduction }: BuildRobotsArgs): Robots => (isProduction ? productionRobots(baseUrl) : blockEverything());
