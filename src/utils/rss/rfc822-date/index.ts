import { dayjs } from '@utils/dayjs';

// RFC-822 date in Asia/Tokyo, e.g. `Wed, 01 Jan 2026 00:00:00 +0900`.
export const toRfc822 = (date: string): string => dayjs(date).tz('Asia/Tokyo').format('ddd, DD MMM YYYY HH:mm:ss ZZ');
