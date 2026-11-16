import type { Robots, RobotsRule } from '../types';

// Port of Next's `resolveRobots` (next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js), limited to the fields of our `Robots` type, plus a
// `Content-Signal:` line (between the agents and the Allow / Disallow lines) that Next
// does not emit. Rules without a content signal keep the bytes the Next route served.
const toArray = (value: string | readonly string[]): readonly string[] => (typeof value === 'string' ? [value] : value);

const directiveLines = (name: string, values: string | readonly string[] | undefined): readonly string[] => (values === undefined ? [] : toArray(values).map((value) => `${name}: ${value}\n`));

const serializeRule = (rule: RobotsRule): string => {
  const agents = directiveLines('User-Agent', rule.userAgent === '' ? '*' : rule.userAgent);
  const signals = directiveLines('Content-Signal', rule.contentSignal);
  const allows = directiveLines('Allow', rule.allow);
  const disallows = directiveLines('Disallow', rule.disallow);

  return `${[...agents, ...signals, ...allows, ...disallows].join('')}\n`;
};

const toRules = (rules: Robots['rules']): readonly RobotsRule[] => (Array.isArray(rules) ? rules : [rules]);

export const serializeRobots = (robots: Robots): string => {
  const sitemap = robots.sitemap === undefined ? '' : `Sitemap: ${robots.sitemap}\n`;

  return `${toRules(robots.rules).map(serializeRule).join('')}${sitemap}`;
};
