import { dayjs } from '@utils/dayjs';

// Single source of truth for the clock format, shared by the live-clock hook and
// the RSC parent that stamps the initial server time, so SSR and client produce
// an identical shape. Kept React-free so a Server Component can import it.
export const formatClock = (): string => dayjs().tz('Asia/Tokyo').format('HH:mm:ss');
