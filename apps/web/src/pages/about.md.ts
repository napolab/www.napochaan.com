import { findProfile } from '@lib/cms/profile';
import { markdownResponse } from '@utils/markdown/response';

import { buildAboutMarkdown } from '../features/about/lib/build-about-markdown';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/about.md/route.ts.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const profile = await findProfile();

  return markdownResponse(buildAboutMarkdown(profile, baseUrl));
};
