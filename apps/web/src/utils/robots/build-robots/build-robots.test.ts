import { describe, expect, it } from 'vitest';

import { AI_SEARCH_CRAWLERS, AI_TRAINING_CRAWLERS, CONTENT_SIGNAL, DISALLOWED_PATHS, buildRobots } from './index';

import type { RobotsRule } from '../types';

const baseUrl = 'https://www.napochaan.com';

const rulesOf = (robots: ReturnType<typeof buildRobots>): readonly RobotsRule[] => (Array.isArray(robots.rules) ? robots.rules : [robots.rules]);

const ruleFor = (robots: ReturnType<typeof buildRobots>, agent: string): RobotsRule | undefined =>
  rulesOf(robots).find((rule) => (typeof rule.userAgent === 'string' ? rule.userAgent === agent : rule.userAgent.includes(agent)));

describe('buildRobots', () => {
  describe('non-production', () => {
    it('disallows everything for every agent, with no sitemap', () => {
      const robots = buildRobots({ baseUrl: 'http://localhost:3000', isProduction: false });
      expect(rulesOf(robots)).toEqual([{ userAgent: '*', disallow: '/' }]);
      expect(robots.sitemap).toBeUndefined();
    });
  });

  describe('production', () => {
    const robots = buildRobots({ baseUrl, isProduction: true });

    it('opens with the * group: content signal, allow the root, disallow private paths', () => {
      const [first] = rulesOf(robots);
      expect(first).toEqual({ userAgent: '*', contentSignal: CONTENT_SIGNAL, allow: '/', disallow: [...DISALLOWED_PATHS] });
    });

    it('keeps the private paths crawlers must never index', () => {
      expect(DISALLOWED_PATHS).toEqual(['/admin', '/api', '/next/', '/news/preview/', '/blog/preview/', '/works/preview/', '/gallery/preview', '/log/preview']);
    });

    it('signals search=yes, ai-train=no, use=reference', () => {
      expect(CONTENT_SIGNAL).toBe('search=yes,ai-train=no,use=reference');
    });

    it.each([...AI_SEARCH_CRAWLERS])('gives the AI search crawler %s its own group with the same signal and paths as *', (agent) => {
      expect(rulesOf(robots)).toContainEqual({ userAgent: agent, contentSignal: CONTENT_SIGNAL, allow: '/', disallow: [...DISALLOWED_PATHS] });
    });

    it('allows exactly the AI search crawlers OAI-SearchBot, Claude-SearchBot and PerplexityBot', () => {
      expect(AI_SEARCH_CRAWLERS).toEqual(['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']);
    });

    it('blocks every AI training crawler with Disallow: / and no content signal', () => {
      expect(rulesOf(robots)).toContainEqual({ userAgent: [...AI_TRAINING_CRAWLERS], disallow: '/' });
    });

    it('lists the 32 AI training crawlers once each', () => {
      expect(AI_TRAINING_CRAWLERS).toHaveLength(32);
      expect(new Set(AI_TRAINING_CRAWLERS).size).toBe(AI_TRAINING_CRAWLERS.length);
    });

    it('never blocks an allowed AI search crawler as a training crawler', () => {
      const training: readonly string[] = AI_TRAINING_CRAWLERS;
      for (const agent of AI_SEARCH_CRAWLERS) {
        expect(training).not.toContain(agent);
      }
    });

    it('resolves each search crawler to its allowed group, not the training block', () => {
      for (const agent of AI_SEARCH_CRAWLERS) {
        expect(ruleFor(robots, agent)?.allow).toBe('/');
      }
      expect(ruleFor(robots, 'GPTBot')?.disallow).toBe('/');
      expect(ruleFor(robots, 'ClaudeBot')?.disallow).toBe('/');
    });

    it('links the sitemap', () => {
      expect(robots.sitemap).toBe(`${baseUrl}/sitemap.xml`);
    });
  });
});
