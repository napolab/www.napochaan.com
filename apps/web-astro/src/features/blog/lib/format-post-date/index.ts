import { dayjs } from '@utils/dayjs';

// The `YYYY.MM.DD` date shown on blog cards and the detail kicker / hero caption — the
// same expression the Next pages used. Server-only: it parses the date-only string in
// the process timezone (UTC on Workers), so never call it inside a hydrated tree.
export const formatPostDate = (date: string): string => dayjs(date).tz('Asia/Tokyo').format('YYYY.MM.DD');
