import { findBlogList } from '@lib/cms/blog';
import { findNewsList } from '@lib/cms/news';
import { findWorksList } from '@lib/cms/works';
import { buildSitemap } from '@utils/sitemap/build-sitemap';
import { serializeSitemap } from '@utils/sitemap/serialize-sitemap';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/sitemap.ts (a Next metadata route, which served
// `application/xml`). BASE_URL and the published content are read per request; the
// worker stamps the purge-driven `cms` policy.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works] = await Promise.all([findNewsList(), findBlogList(), findWorksList()]);

  return new Response(serializeSitemap(buildSitemap({ baseUrl, news, blog, works })), { headers: { 'content-type': 'application/xml' } });
};
