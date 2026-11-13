import { findBlogBySlug } from '@lib/cms/blog';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildPostMarkdown } from '../../features/blog/lib/build-post-markdown';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/blog/[slug]/md/route.ts (Next rewrote `/blog/:slug.md`
// onto it). The static `.md` suffix outranks `[slug].astro`, and the slug keeps its
// own dots: `/blog/a.b.md` → `a.b`.
export const GET: APIRoute = async ({ params }) => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const post = await findBlogBySlug(params.slug ?? '');
  if (post === undefined) return notFoundResponse();

  return markdownResponse(buildPostMarkdown(post, baseUrl));
};
