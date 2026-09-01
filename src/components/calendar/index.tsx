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

// 'compact' は metaRow / popover / colophon デモ用の既定サイズ。'full' はカレンダー
// 単体ページ（/log/calendar）向けに、セルと見出しを読み物サイズまで引き上げる。
export type CalendarSize = 'compact' | 'full';

type Props = {
  marks?: CalendarMark[];
  minDate?: string;
  maxDate?: string;
  label: string;
  size?: CalendarSize;
};

const toCalendarDate = (iso?: string): CalendarDate | undefined => {
  if (iso === undefined) return undefined;
  return parseDate(iso);
};

// 汎用の読み取り専用カレンダー（isReadOnly）— 日付選択は持たない。表示月は
// react-aria が今日を minValue/maxValue の範囲にクランプして決める。
// 見出し・凡例・枠などの組み立ては呼び出し側の責務（例: log/calendar/_components/calendar-section）。
export const Calendar = ({ marks, minDate, maxDate, label, size = 'compact' }: Props) => {
  const markMap = useMemo(() => new Map(marks?.map((mark) => [mark.date, mark.tone ?? 'default']) ?? []), [marks]);

  // 子孫セレクタは使わない規約なので、size は各要素に data-size として配る。
  // CalendarDate#toString() は 'YYYY-MM-DD' — mark のキーとそのまま突き合わせる。
  const renderCell = useCallback((date: CalendarDate) => <CalendarCell className={styles.cell} date={date} data-tone={markMap.get(date.toString())} data-size={size} />, [markMap, size]);

  const renderHeaderCell = useCallback(
    (day: string) => (
      <CalendarHeaderCell className={styles.headerCell} data-size={size}>
        {day}
      </CalendarHeaderCell>
    ),
    [size],
  );

  return (
    <I18nProvider locale="ja-JP">
      <AriaCalendar className={styles.root} aria-label={label} isReadOnly minValue={toCalendarDate(minDate)} maxValue={toCalendarDate(maxDate)}>
        <header className={styles.headerRoot}>
          <Button slot="previous" className={styles.navButton} data-size={size} aria-label="前の月">
            ‹
          </Button>
          <Heading className={styles.heading} data-size={size} />
          <Button slot="next" className={styles.navButton} data-size={size} aria-label="次の月">
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
