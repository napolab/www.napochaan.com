import { findBlogBySlug } from '@lib/payload/blog';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildPostMarkdown } from '../../_lib/build-post-markdown';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export const GET = async (_request: Request, { params }: Context): Promise<Response> => {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const post = await findBlogBySlug(slug);
  if (post === undefined) return notFoundResponse();

  return markdownResponse(buildPostMarkdown(post, baseUrl));
};
