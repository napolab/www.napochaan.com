import { LogSection } from '../../../_components/log-section';
import { selectHomeLogTeaser } from '../../../_lib/select-home-log-teaser';
import { buildLogTimeline } from '../../../log/_lib/build-log-timeline';
import { fetchExternalPosts } from '../../../log/_lib/fetch-external-posts';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

// Number of log entries shown in the home teaser (upcoming-first, then recent).
const HOME_LOG_LIMIT = 5;

export const LogSectionLoader = async () => {
  const [works, externalPosts, logs] = await Promise.all([findWorksList(), fetchExternalPosts(), findLogList()]);

  const now = dayjs().tz('Asia/Tokyo').toISOString();
  // Build the full timeline from works/posts/logs; the home teaser leads with the
  // soonest upcoming gigs and backfills with the most recent finished entries.
  const logGroups = buildLogTimeline(works, externalPosts, now, logs);
  const logEntries = selectHomeLogTeaser(
    logGroups.flatMap((group) => group.items),
    HOME_LOG_LIMIT,
  ).toReversed();

  return <LogSection id="log" entries={logEntries} />;
};
