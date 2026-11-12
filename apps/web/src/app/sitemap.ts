import { findBlogList } from '@lib/cms/blog';
import { findNewsList } from '@lib/cms/news';
import { findWorksList } from '@lib/cms/works';
import { buildSitemap } from '@utils/sitemap/build-sitemap';

import type { MetadataRoute } from 'next';

// Force runtime resolution (mirrors robots.ts): at `next build` BASE_URL is
// unset (so it would bake in `http://localhost:3000`) and the data layer's build
// guard returns [] (so detail entries would be empty). Resolving per-request
// reads the real host BASE_URL and queries published content at runtime. The
// underlying findXList() reads go to the cms over the CMS service binding.
export const dynamic = 'force-dynamic';

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works] = await Promise.all([findNewsList(), findBlogList(), findWorksList()]);

  return buildSitemap({ baseUrl, news, blog, works });
};

export default sitemap;
