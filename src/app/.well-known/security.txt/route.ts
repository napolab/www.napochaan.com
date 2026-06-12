import { dayjs } from '@utils/dayjs';
import { buildSecurityTxt } from '@utils/security/build-security-txt';

// Resolve per-request (mirrors robots.ts / llms.txt) so the Expires field is always
// computed from "now" and never bakes a stale date in at build time.
export const dynamic = 'force-dynamic';

const CONTACT_EMAIL = 'contact@napochaan.com';

export const GET = (): Response => {
  const text = buildSecurityTxt({ contactEmail: CONTACT_EMAIL, now: dayjs() });

  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
