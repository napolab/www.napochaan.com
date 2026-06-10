import { findProfile } from '@lib/payload/profile';
import { findBlogList } from '@lib/payload/blog';
import { findNewsList } from '@lib/payload/news';
import { findWorksList } from '@lib/payload/works';
import { buildLLMsFullTxt } from '@utils/llms/build-llms-full-txt';

// ISR: the data layer's build guard returns empty data at `next build`, so this
// caches a valid static-only document that ISR fills at runtime.
export const revalidate = 3600;

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [news, blog, works, profile] = await Promise.all([findNewsList(), findBlogList(), findWorksList(), findProfile()]);

  const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });

  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
