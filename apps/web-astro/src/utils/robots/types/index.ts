// robots.txt content (same shape as Next's `MetadataRoute.Robots`).
export type RobotsRule = {
  userAgent: string;
  allow?: string | string[];
  disallow?: string | string[];
};

export type Robots = {
  rules: RobotsRule | RobotsRule[];
  sitemap?: string;
};
