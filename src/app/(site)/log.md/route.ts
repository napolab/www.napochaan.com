import { dayjs } from '@utils/dayjs';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { markdownResponse } from '@utils/markdown/response';

import { buildLogMarkdown } from '../log/_lib/build-log-markdown';
import { buildLogTimeline } from '../log/_lib/build-log-timeline';
import { fetchExternalPosts } from '../log/_lib/fetch-external-posts';

export const dynamic = 'force-dynamic';

// Assembles the same timeline as the /log page (works + external posts + manual
// log entries), then flattens it to a markdown chronicle. `now` mirrors
// log-timeline-section exactly: dayjs().tz('Asia/Tokyo').toISOString().
export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [works, posts, logs] = await Promise.all([findWorksList(), fetchExternalPosts(), findLogList()]);
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(works, posts, now, logs);

  return markdownResponse(buildLogMarkdown(groups, baseUrl));
};
