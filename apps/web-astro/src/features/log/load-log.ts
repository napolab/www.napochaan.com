import { findLogDraftList, findLogList } from '@lib/cms/logs';
import { findWorksList } from '@lib/cms/works';
import { dayjs } from '@utils/dayjs';

import { buildLogTimeline } from './lib/build-log-timeline';
import { collectLogDates } from './lib/collect-log-dates';
import { fetchExternalPosts } from './lib/fetch-external-posts';

import type { LogDateMark } from './lib/collect-log-dates';
import type { CalendarMark } from '@components/calendar';

// The three /log sources (cms works + manual logs, external posts), read once per
// render and stamped with one `now` (Asia/Tokyo), as log-timeline-section did.
const loadLogSources = async () => {
  const [works, posts, logs] = await Promise.all([findWorksList(), fetchExternalPosts(), findLogList()]);

  return { works, posts, logs, now: dayjs().tz('Asia/Tokyo').toISOString() };
};

// upcoming（log ドメイン）→ tone（表示）への変換はこの境界で行う（Next の log-calendar-section）。
const toCalendarMark = (mark: LogDateMark): CalendarMark => ({ date: mark.date, tone: mark.upcoming ? 'accent' : 'default' });

// The year groups for the timeline (and /log.md, /log/rss.xml).
export const loadLogTimeline = async () => {
  const { works, posts, logs, now } = await loadLogSources();

  return buildLogTimeline(works, posts, now, logs);
};

// The /log page: the timeline plus the calendar's marked days and month range, from
// the same sources and the same `now`.
export const loadLogPage = async () => {
  const { works, posts, logs, now } = await loadLogSources();
  const { marks, minDate, maxDate } = collectLogDates(works, posts, logs, now);

  return {
    groups: buildLogTimeline(works, posts, now, logs),
    calendar: { marks: marks.map(toCalendarMark), minDate, maxDate },
  };
};

// The /log/preview page (port of log/preview/page.tsx inside log/layout.tsx): only the
// timeline reads the `logs` drafts. Works and external posts stay published, and the
// layout's calendar keeps the published sources, as in Next.
export const loadLogPreview = async (previewSecret: string) => {
  const [{ works, posts, logs, now }, draftLogs] = await Promise.all([loadLogSources(), findLogDraftList(previewSecret)]);
  const { marks, minDate, maxDate } = collectLogDates(works, posts, logs, now);

  return {
    groups: buildLogTimeline(works, posts, now, draftLogs),
    calendar: { marks: marks.map(toCalendarMark), minDate, maxDate },
  };
};
