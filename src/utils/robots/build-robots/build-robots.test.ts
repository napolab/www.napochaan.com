import { describe, expect, it } from 'vitest';

import { buildRobots } from './index';

const baseUrl = 'https://www.napochaan.com';

const firstRule = (robots: ReturnType<typeof buildRobots>): { allow?: string | string[]; disallow?: string | string[] } => {
  const { rules } = robots;
  if (Array.isArray(rules)) {
    const [rule] = rules;
    return rule ?? {};
  }

  return rules ?? {};
};

describe('buildRobots', () => {
  it('disallows everything when not production', () => {
    const robots = buildRobots({ baseUrl: 'http://localhost:3000', isProduction: false });
    expect(firstRule(robots).disallow).toBe('/');
    expect(robots.sitemap).toBeUndefined();
  });

  it('allows the root and disallows private paths in production', () => {
    const robots = buildRobots({ baseUrl, isProduction: true });
    const rule = firstRule(robots);
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toContain('/admin');
    expect(rule.disallow).toContain('/api');
    expect(rule.disallow).toContain('/news/preview/');
    expect(rule.disallow).toContain('/blog/preview/');
    expect(rule.disallow).toContain('/works/preview/');
  });

  it('links the sitemap in production', () => {
    const robots = buildRobots({ baseUrl, isProduction: true });
    expect(robots.sitemap).toBe(`${baseUrl}/sitemap.xml`);
  });
});
