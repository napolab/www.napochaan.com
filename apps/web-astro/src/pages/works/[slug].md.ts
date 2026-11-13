import { findWorkBySlug } from '@lib/cms/works';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildWorkMarkdown } from '../../features/works/lib/build-work-markdown';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/works/[slug]/md/route.ts (Next rewrote `/works/:slug.md`
// onto it). The static `.md` suffix outranks `[slug].astro`, and the slug keeps its own
// dots: `/works/a.b.md` → `a.b`.
export const GET: APIRoute = async ({ params }) => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const work = await findWorkBySlug(params.slug ?? '');
  if (work === undefined) return notFoundResponse();

  return markdownResponse(buildWorkMarkdown(work, baseUrl));
};
