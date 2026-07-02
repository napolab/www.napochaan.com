'use client';

import { parseDate } from '@internationalized/date';
import { useCallback, useMemo } from 'react';
import { Button, Calendar as AriaCalendar, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, Heading, I18nProvider } from 'react-aria-components';

import * as styles from './styles.css';

import type { CalendarDate } from '@internationalized/date';

// 'YYYY-MM-DD' の日付と、その日に付ける視覚的なトーン。tone を省略すると 'default'。
export type CalendarMark = {
  date: string;
  tone?: 'default' | 'accent';
};

type Props = {
  marks?: CalendarMark[];
  minDate?: string;
  maxDate?: string;
  label: string;
};

const toCalendarDate = (iso?: string): CalendarDate | undefined => {
  if (iso === undefined) return undefined;
  return parseDate(iso);
};

const renderHeaderCell = (day: string) => <CalendarHeaderCell className={styles.headerCell}>{day}</CalendarHeaderCell>;

// 汎用の読み取り専用カレンダー（isReadOnly）— 日付選択は持たない。表示月は
// react-aria が今日を minValue/maxValue の範囲にクランプして決める。
// トリガー + Popover などの組み立ては呼び出し側の責務（例: log/_components/log-calendar）。
export const Calendar = ({ marks, minDate, maxDate, label }: Props) => {
  const markMap = useMemo(() => new Map(marks?.map((mark) => [mark.date, mark.tone ?? 'default']) ?? []), [marks]);

  // CalendarDate#toString() は 'YYYY-MM-DD' — mark のキーとそのまま突き合わせる。
  const renderCell = useCallback((date: CalendarDate) => <CalendarCell className={styles.cell} date={date} data-tone={markMap.get(date.toString())} />, [markMap]);

  return (
    <I18nProvider locale="ja-JP">
      <AriaCalendar aria-label={label} isReadOnly minValue={toCalendarDate(minDate)} maxValue={toCalendarDate(maxDate)}>
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
      </AriaCalendar>
    </I18nProvider>
  );
};
