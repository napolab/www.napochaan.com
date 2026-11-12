import { dayjs } from '@utils/dayjs';

import type { ExternalPost } from '../external-feeds';
import type { LogManualItem } from '../log-manual-item';
import type { WorkRow } from '../../../works/_lib/work-row';

// 集計結果の 1 日ぶん。upcoming は log ドメインの意味論（当日いっぱいまで）で、
// 表示トーンへの変換は描画側（log-calendar-section）の責務。
export type LogDateMark = {
  date: string;
  upcoming: boolean;
};

export type CollectLogDatesResult = {
  marks: LogDateMark[];
  minDate?: string;
  maxDate?: string;
};

const toDayKey = (iso: string): string => dayjs(iso).tz('Asia/Tokyo').format('YYYY-MM-DD');

// buildLogTimeline の toManualEntry と同じ境界: エントリは自分の日の終わりまで
// upcoming（Asia/Tokyo・day precision）。upcoming になり得るのは manual log のみ。
const isUpcoming = (iso: string, now: string): boolean => {
  const at = dayjs(iso).tz('Asia/Tokyo').startOf('day');
  const today = dayjs(now).tz('Asia/Tokyo').startOf('day');

  return !at.isBefore(today);
};

// タイムラインと同じ 3 ソースから「エントリのある日」を集める。日付なし works は
// 除外。同日複数エントリは 1 mark に畳み、upcoming が 1 つでもあれば upcoming。
// min/max はカレンダーの月送り範囲（最古の月初〜最新の月末）。純関数。
export const collectLogDates = (works: readonly WorkRow[], posts: readonly ExternalPost[], logs: readonly LogManualItem[], now: string): CollectLogDatesResult => {
  const workMarks = works.flatMap((work) => (work.date === undefined ? [] : [{ date: toDayKey(work.date), upcoming: false }]));
  const postMarks = posts.map((post) => ({ date: toDayKey(post.date), upcoming: false }));
  const logMarks = logs.map((log) => ({ date: toDayKey(log.date), upcoming: isUpcoming(log.date, now) }));

  const merged = [...workMarks, ...postMarks, ...logMarks].reduce<Map<string, boolean>>((acc, mark) => acc.set(mark.date, (acc.get(mark.date) ?? false) || mark.upcoming), new Map());

  const keys = [...merged.keys()].sort();
  const [first] = keys;
  const last = keys.at(-1);

  return {
    marks: keys.map((date) => ({ date, upcoming: merged.get(date) === true })),
    get minDate() {
      if (first === undefined) return undefined;

      return dayjs(first).tz('Asia/Tokyo').startOf('month').format('YYYY-MM-DD');
    },
    get maxDate() {
      if (last === undefined) return undefined;

      return dayjs(last).tz('Asia/Tokyo').endOf('month').format('YYYY-MM-DD');
    },
  };
};
