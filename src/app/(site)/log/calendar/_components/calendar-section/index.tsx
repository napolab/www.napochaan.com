import { ToneLegend } from '../tone-legend';
import * as styles from './styles.css';

import { loadLogCalendar } from '../../../_lib/load-log-calendar';
import { Calendar } from '@components/calendar';

// カレンダー単体ページの本体。ここではカレンダーが主役なので、metaRow の導線と
// 違って取得失敗を握り潰さない — そのまま log/error.tsx に投げて retry を出す。
export const CalendarSection = async () => {
  const { marks, minDate, maxDate } = await loadLogCalendar();

  return (
    <section className={styles.root} aria-labelledby="calendar-heading">
      <h2 className={styles.heading} id="calendar-heading">
        活動カレンダー
      </h2>
      <ToneLegend />
      <div className={styles.calendarRoot}>
        <Calendar marks={marks} minDate={minDate} maxDate={maxDate} label="活動カレンダー" size="full" />
      </div>
    </section>
  );
};
