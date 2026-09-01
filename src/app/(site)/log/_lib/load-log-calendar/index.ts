import { collectLogDates } from '../collect-log-dates';
import { fetchExternalPosts } from '../fetch-external-posts';

import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

import type { LogDateMark } from '../collect-log-dates';
import type { CalendarMark } from '@components/calendar';

export type LogCalendarData = {
  marks: CalendarMark[];
  minDate?: string;
  maxDate?: string;
};

// upcoming（log ドメイン）→ tone（表示）への変換はこの境界で行う。名前付き
// module-scope ヘルパーで .map() を JSX の外に出す（react-perf/jsx-no-new-array-as-prop）。
const toCalendarMark = (mark: LogDateMark): CalendarMark => ({
  date: mark.date,
  tone: mark.upcoming ? 'accent' : 'default',
});

// タイムラインと同じ 3 ソース（unstable_cache 済みなので page 側と実体は共有）を
// 集計してカレンダー用の marks に変換する。ISR にそのまま乗る。
// 失敗の扱い（握り潰すか error boundary に投げるか）は呼び出し側の責務。
export const loadLogCalendar = async (): Promise<LogCalendarData> => {
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const { marks, minDate, maxDate } = collectLogDates(works, posts, logs, now);

  return { marks: marks.map(toCalendarMark), minDate, maxDate };
};
