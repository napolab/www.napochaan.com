import { dayjs } from '@utils/dayjs';

type BuildSecurityTxtArgs = {
  contactEmail: string;
  // Injected so the Expires field is deterministic in tests; the route passes the
  // request-time `dayjs()`.
  now: ReturnType<typeof dayjs>;
};

// RFC 9116 recommends Expires be less than a year out. 180 days keeps the file
// comfortably valid; resolving per-request (see route) means it never goes stale.
const EXPIRY_DAYS = 180;

// Build a /.well-known/security.txt body per RFC 9116. Only Contact and Expires
// are required; Preferred-Languages is a courtesy for a JP/EN bilingual reporter.
export const buildSecurityTxt = ({ contactEmail, now }: BuildSecurityTxtArgs): string => {
  const expires = now.tz('Asia/Tokyo').add(EXPIRY_DAYS, 'day').toISOString();

  const lines = [`Contact: mailto:${contactEmail}`, `Expires: ${expires}`, 'Preferred-Languages: ja, en'];

  return `${lines.join('\n')}\n`;
};
