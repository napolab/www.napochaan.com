import type { MetadataRoute } from 'next';

type BuildRobotsArgs = {
  baseUrl: string;
  isProduction: boolean;
};

// Non-public segments crawlers must never index, even in production.
const DISALLOWED_PATHS = ['/admin', '/api', '/next/', '/news/preview/', '/blog/preview/', '/works/preview/', '/gallery/preview', '/log/preview'] as const;

export const buildRobots = ({ baseUrl, isProduction }: BuildRobotsArgs): MetadataRoute.Robots => {
  // Non-production hosts (preview/local) block the whole site so staging never
  // gets indexed, and they expose no sitemap.
  if (!isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/', disallow: [...DISALLOWED_PATHS] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
};
