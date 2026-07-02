'use client';

import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components';

import * as styles from './styles.css';

import { Calendar } from '@components/calendar';

import type { CalendarMark } from '@components/calendar';

type Props = {
  marks: CalendarMark[];
  minDate?: string;
  maxDate?: string;
  label: string;
};

const CalendarIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="2.5" width="12" height="10.5" />
    <path d="M1 5.5h12" />
    <path d="M4.5 1v3M9.5 1v3" />
  </svg>
);

// log 専用の組み立て: トリガー + Popover + Dialog で汎用 Calendar プリミティブを包む。
export const LogCalendar = ({ marks, minDate, maxDate, label }: Props) => (
  <DialogTrigger>
    <Button className={styles.trigger} aria-label={`${label}を表示`}>
      <CalendarIcon />
    </Button>
    <Popover className={styles.popover} placement="bottom end">
      <Dialog className={styles.dialog} aria-label={label}>
        <Calendar marks={marks} minDate={minDate} maxDate={maxDate} label={label} />
      </Dialog>
    </Popover>
  </DialogTrigger>
);
