import { LogTimeline } from '../log-timeline';
import { buildLogTimeline } from '../../_lib/build-log-timeline';
import { fetchExternalPosts } from '../../_lib/fetch-external-posts';

import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

export const LogTimelineSection = async () => {
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(works, posts, now, logs);

  return <LogTimeline groups={groups} />;
};
