import { findBlogList } from '@lib/cms/blog';
import { markdownResponse } from '@utils/markdown/response';

import { buildBlogIndexMarkdown } from '../blog/_lib/build-blog-index-markdown';

// Runtime resolution, mirroring llms.txt: BASE_URL and published content are
// per-request concerns; the findXList reads go to the cms over the CMS service binding.
export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const posts = await findBlogList();

  return markdownResponse(buildBlogIndexMarkdown(posts, baseUrl));
};
