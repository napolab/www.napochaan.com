import { findBlogList } from '@lib/cms/blog';
import { findNewsList } from '@lib/cms/news';
import { findProfile } from '@lib/cms/profile';
import { findWorksList } from '@lib/cms/works';
import { buildLLMsFullTxt } from '@utils/llms/build-llms-full-txt';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/llms-full.txt/route.ts. BASE_URL and the published content are
// read per request; the worker stamps the purge-driven `cms` policy.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works, profile] = await Promise.all([findNewsList(), findBlogList(), findWorksList(), findProfile()]);

  return new Response(buildLLMsFullTxt({ baseUrl, news, blog, works, profile }), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
