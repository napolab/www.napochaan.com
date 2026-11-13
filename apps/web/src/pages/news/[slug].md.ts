import { findNewsBySlug } from '@lib/cms/news';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildNewsItemMarkdown } from '../../features/news/lib/build-news-item-markdown';
import { isExternalNews } from '../../features/news/lib/is-external-news';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/news/[slug]/md/route.ts (Next rewrote `/news/:slug.md`
// onto it). The static `.md` suffix outranks `[slug].astro`, and the slug keeps its own
// dots: `/news/a.b.md` → `a.b`. An external item has no detail page, so its `.md` twin
// 404s too.
export const GET: APIRoute = async ({ params }) => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const item = await findNewsBySlug(params.slug ?? '');
  if (item === undefined || isExternalNews(item)) return notFoundResponse();

  return markdownResponse(buildNewsItemMarkdown(item, baseUrl));
};
