// One `<url>` of sitemap.xml (same fields as Next's `MetadataRoute.Sitemap`).
export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

export type Sitemap = SitemapEntry[];
