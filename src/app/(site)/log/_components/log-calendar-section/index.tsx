import { collectLogDates } from '../../_lib/collect-log-dates';
import { fetchExternalPosts } from '../../_lib/fetch-external-posts';
import { LogCalendar } from '../log-calendar';

import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

import type { LogDateMark } from '../../_lib/collect-log-dates';
import type { CalendarMark } from '@components/calendar';

// upcoming（log ドメイン）→ tone（表示）への変換はこの境界で行う。名前付き
// module-scope ヘルパーで .map() を JSX の外に出す（react-perf/jsx-no-new-array-as-prop）。
const toCalendarMark = (mark: LogDateMark): CalendarMark => ({
  date: mark.date,
  tone: mark.upcoming ? 'accent' : 'default',
});

const toCalendarMarks = (marks: readonly LogDateMark[]): CalendarMark[] => marks.map(toCalendarMark);

// タイムラインと同じ 3 ソース（unstable_cache 済みなので page 側と実体は共有）を
// 集計してカレンダーに渡す。ISR(3600s) にそのまま乗る。
export const LogCalendarSection = async () => {
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const { marks, minDate, maxDate } = collectLogDates(works, posts, logs, now);

  return <LogCalendar marks={toCalendarMarks(marks)} minDate={minDate} maxDate={maxDate} label="活動カレンダー" />;
};
