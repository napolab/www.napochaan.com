import { findNewsBySlug } from '@lib/payload/news';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildNewsItemMarkdown } from '../../_lib/build-news-item-markdown';
import { isExternalNews } from '../../_lib/is-external-news';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

// External news items have no internal detail page (the HTML route 404s too,
// per src/app/(site)/news/[slug]/page.tsx), so their .md twin mirrors that.
export const GET = async (_request: Request, { params }: Context): Promise<Response> => {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const item = await findNewsBySlug(slug);
  if (item === undefined || isExternalNews(item)) return notFoundResponse();

  return markdownResponse(buildNewsItemMarkdown(item, baseUrl));
};
