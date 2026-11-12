import { findWorkBySlug } from '@lib/payload/works';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildWorkMarkdown } from '../../_lib/build-work-markdown';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export const GET = async (_request: Request, { params }: Context): Promise<Response> => {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const work = await findWorkBySlug(slug);
  if (work === undefined) return notFoundResponse();

  return markdownResponse(buildWorkMarkdown(work, baseUrl));
};
