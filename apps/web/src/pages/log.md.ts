import { markdownResponse } from '@utils/markdown/response';

import { buildLogMarkdown } from '../features/log/lib/build-log-markdown';
import { loadLogTimeline } from '../features/log/load-log';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/log.md/route.ts: the /log timeline flattened to a
// markdown chronicle. Cached under the worker's `timeSensitive` policy.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return markdownResponse(buildLogMarkdown(await loadLogTimeline(), baseUrl));
};
