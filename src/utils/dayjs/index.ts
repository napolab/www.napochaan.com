import dayjsLib from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjsLib.extend(utc);
dayjsLib.extend(timezone);

export const dayjs = dayjsLib;
