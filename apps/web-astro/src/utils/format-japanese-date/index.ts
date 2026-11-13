import { dayjs } from '@utils/dayjs';

// Payload の date フィールドは ISO タイムスタンプで返るため、必ず Asia/Tokyo に寄せてから
// 暦日を取る。`M` / `D` はゼロ埋めしないトークン(8月1日であって 08月01日ではない)。
export const formatJapaneseDate = (iso: string): string => dayjs(iso).tz('Asia/Tokyo').format('YYYY年M月D日');
