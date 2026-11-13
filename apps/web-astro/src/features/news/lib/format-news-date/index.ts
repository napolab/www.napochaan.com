import { dayjs } from '@utils/dayjs';

// The dates the Next news pages formatted inline. Server-only: they parse the date-only
// string in the process timezone (UTC on Workers), so never call them inside a hydrated
// tree.

// `YYYY.MM.DD` — the detail kicker and the OG card meta line.
export const formatNewsDate = (date: string): string => dayjs(date).tz('Asia/Tokyo').format('YYYY.MM.DD');

// `MM.DD` — an archive row (the year-month lives in the group heading).
export const formatNewsMonthDay = (date: string): string => dayjs(date).tz('Asia/Tokyo').format('MM.DD');
