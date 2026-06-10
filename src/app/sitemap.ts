import { findBlogList } from '@lib/payload/blog';
import { findNewsList } from '@lib/payload/news';
import { findWorksList } from '@lib/payload/works';
import { buildSitemap } from '@utils/sitemap/build-sitemap';

import type { MetadataRoute } from 'next';

// ISR: at `next build` the data layer's build guard returns [], so this caches a
// valid static-only sitemap that ISR fills with detail pages at runtime.
export const revalidate = 3600;

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works] = await Promise.all([findNewsList(), findBlogList(), findWorksList()]);

  return buildSitemap({ baseUrl, news, blog, works });
};

export default sitemap;
