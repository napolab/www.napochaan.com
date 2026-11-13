import type { Robots, RobotsRule } from '../types';

// Port of Next's `resolveRobots` (next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js), limited to the fields of our `Robots` type, so /robots.txt
// keeps the exact bytes the Next `robots.ts` metadata route served.
const toArray = (value: string | readonly string[]): readonly string[] => (typeof value === 'string' ? [value] : value);

const serializeRule = (rule: RobotsRule): string => {
  const agents = toArray(rule.userAgent === '' ? '*' : rule.userAgent).map((agent) => `User-Agent: ${agent}\n`);
  const allows = rule.allow === undefined ? [] : toArray(rule.allow).map((path) => `Allow: ${path}\n`);
  const disallows = rule.disallow === undefined ? [] : toArray(rule.disallow).map((path) => `Disallow: ${path}\n`);

  return `${[...agents, ...allows, ...disallows].join('')}\n`;
};

export const serializeRobots = (robots: Robots): string => {
  const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
  const sitemap = robots.sitemap === undefined ? '' : `Sitemap: ${robots.sitemap}\n`;

  return `${rules.map(serializeRule).join('')}${sitemap}`;
};
