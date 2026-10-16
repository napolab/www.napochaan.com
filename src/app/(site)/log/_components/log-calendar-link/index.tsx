import * as styles from './styles.css';

import { Link } from '@components/link';

type Props = {
  label: string;
};

const CalendarIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="2.5" width="12" height="10.5" />
    <path d="M1 5.5h12" />
    <path d="M4.5 1v3M9.5 1v3" />
  </svg>
);

// metaRow のカレンダー導線。以前は Popover に畳んだミニカレンダーを出していたが、
// カレンダーは /log/calendar が単体ページとして持つようになったので、ここは
// そのページへの入り口だけを担う（カレンダーの二重管理をしない）。
export const LogCalendarLink = ({ label }: Props) => (
  <Link className={styles.link} href="/log/calendar" tone="muted" underline={false} aria-label={`${label}を開く`}>
    <CalendarIcon />
  </Link>
);
