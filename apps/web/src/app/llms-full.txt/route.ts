import { findProfile } from '@lib/cms/profile';
import { findBlogList } from '@lib/cms/blog';
import { findNewsList } from '@lib/cms/news';
import { findWorksList } from '@lib/cms/works';
import { buildLLMsFullTxt } from '@utils/llms/build-llms-full-txt';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guard
// returns empty data. Resolving per-request reads the real host BASE_URL and
// published content at runtime; the findXList() reads go to the cms
// over the CMS service binding.
export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works, profile] = await Promise.all([findNewsList(), findBlogList(), findWorksList(), findProfile()]);

  const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });

  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
