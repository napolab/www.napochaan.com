import { findWorksList } from '@lib/payload/works';
import { markdownResponse } from '@utils/markdown/response';

import { buildWorksIndexMarkdown } from '../works/_lib/build-works-index-markdown';

export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const works = await findWorksList();

  return markdownResponse(buildWorksIndexMarkdown(works, baseUrl));
};
