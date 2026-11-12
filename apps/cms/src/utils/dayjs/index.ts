import dayjsLib from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjsLib.extend(utc);
dayjsLib.extend(timezone);
dayjsLib.extend(customParseFormat);

export const dayjs = dayjsLib;
