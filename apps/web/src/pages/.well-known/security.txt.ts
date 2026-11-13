import { dayjs } from '@utils/dayjs';
import { buildSecurityTxt } from '@utils/security/build-security-txt';

import type { APIRoute } from 'astro';

const CONTACT_EMAIL = 'contact@napochaan.com';

// Port of apps/web/src/app/.well-known/security.txt/route.ts. Expires is computed from
// the request-time "now"; the worker caches it under the short `timeSensitive` policy.
export const GET: APIRoute = () => new Response(buildSecurityTxt({ contactEmail: CONTACT_EMAIL, now: dayjs() }), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
