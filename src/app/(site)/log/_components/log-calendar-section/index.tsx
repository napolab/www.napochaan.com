import { collectLogDates } from '../../_lib/collect-log-dates';
import { fetchExternalPosts } from '../../_lib/fetch-external-posts';

import { ActivityCalendar } from '@components/activity-calendar';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

// タイムラインと同じ 3 ソース（unstable_cache 済みなので page 側と実体は共有）を
// 集計してカレンダーに渡す。ISR(3600s) にそのまま乗る。
export const LogCalendarSection = async () => {
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const { marks, minDate, maxDate } = collectLogDates(works, posts, logs, now);

  return <ActivityCalendar marks={marks} minDate={minDate} maxDate={maxDate} label="活動カレンダー" />;
};
