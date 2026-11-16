// robots.txt content (Next's `MetadataRoute.Robots` shape, plus the Content Signals
// directive https://contentsignals.org/ that Next does not model).
export type RobotsRule = {
  // Several agents share one group (RFC 9309 §2.1): one `User-Agent:` line each.
  userAgent: string | readonly string[];
  contentSignal?: string;
  allow?: string | readonly string[];
  disallow?: string | readonly string[];
};

export type Robots = {
  rules: RobotsRule | RobotsRule[];
  sitemap?: string;
};
