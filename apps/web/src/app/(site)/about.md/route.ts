import { findProfile } from '@lib/payload/profile';
import { markdownResponse } from '@utils/markdown/response';

import { buildAboutMarkdown } from '../about/_lib/build-about-markdown';

export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const profile = await findProfile();

  return markdownResponse(buildAboutMarkdown(profile, baseUrl));
};
