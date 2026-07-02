'use client';

import { parseDate } from '@internationalized/date';
import { useCallback, useMemo } from 'react';
import { Button, Calendar, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, Dialog, DialogTrigger, Heading, I18nProvider, Popover } from 'react-aria-components';

import * as styles from './styles.css';

import type { CalendarDate } from '@internationalized/date';

// 'YYYY-MM-DD'（Asia/Tokyo で正規化済み）の日付と、その日が「これから」かどうか。
// upcoming の判定はサーバー側（collectLogDates）の責務 — この component は描き分けるだけ。
export type ActivityCalendarMark = {
  date: string;
  upcoming: boolean;
};

type Props = {
  marks: ActivityCalendarMark[];
  minDate?: string;
  maxDate?: string;
  label: string;
};

const toCalendarDate = (iso?: string): CalendarDate | undefined => {
  if (iso === undefined) return undefined;
  return parseDate(iso);
};

const resolveMark = (upcoming?: boolean): 'past' | 'upcoming' | undefined => {
  if (upcoming === undefined) return undefined;
  return upcoming ? 'upcoming' : 'past';
};

const CalendarIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="2.5" width="12" height="10.5" />
    <path d="M1 5.5h12" />
    <path d="M4.5 1v3M9.5 1v3" />
  </svg>
);

const renderHeaderCell = (day: string) => <CalendarHeaderCell className={styles.headerCell}>{day}</CalendarHeaderCell>;

// 純粋な可視化（isReadOnly）— 日付選択は持たない。表示月は react-aria が
// 今日を minValue/maxValue の範囲にクランプして決める。
export const ActivityCalendar = ({ marks, minDate, maxDate, label }: Props) => {
  const markMap = useMemo(() => new Map(marks.map((mark) => [mark.date, mark.upcoming])), [marks]);

  // CalendarDate#toString() は 'YYYY-MM-DD' — mark のキーとそのまま突き合わせる。
  const renderCell = useCallback((date: CalendarDate) => <CalendarCell className={styles.cell} date={date} data-mark={resolveMark(markMap.get(date.toString()))} />, [markMap]);

  return (
    <DialogTrigger>
      <Button className={styles.trigger} aria-label={label}>
        <CalendarIcon />
      </Button>
      <Popover className={styles.popover} placement="bottom end">
        <Dialog className={styles.dialog} aria-label={label}>
          <I18nProvider locale="ja-JP">
            <Calendar isReadOnly minValue={toCalendarDate(minDate)} maxValue={toCalendarDate(maxDate)}>
              <header className={styles.headerRoot}>
                <Button slot="previous" className={styles.navButton} aria-label="前の月">
                  ‹
                </Button>
                <Heading className={styles.heading} />
                <Button slot="next" className={styles.navButton} aria-label="次の月">
                  ›
                </Button>
              </header>
              <CalendarGrid>
                <CalendarGridHeader>{renderHeaderCell}</CalendarGridHeader>
                <CalendarGridBody>{renderCell}</CalendarGridBody>
              </CalendarGrid>
            </Calendar>
          </I18nProvider>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};
