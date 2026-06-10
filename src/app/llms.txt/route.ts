import { findProfile } from '@lib/payload/profile';
import { findBlogList } from '@lib/payload/blog';
import { findNewsList } from '@lib/payload/news';
import { findWorksList } from '@lib/payload/works';
import { buildLLMsTxt } from '@utils/llms/build-llms-txt';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guard
// returns empty data. Resolving per-request reads the real host BASE_URL and
// published content at runtime; the findXList() reads stay cached via
// unstable_cache + their revalidateTag hooks.
export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works, profile] = await Promise.all([findNewsList(), findBlogList(), findWorksList(), findProfile()]);

  const text = buildLLMsTxt({ baseUrl, news, blog, works, profile });

  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
