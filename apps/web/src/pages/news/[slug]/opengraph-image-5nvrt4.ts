import { renderNewsOgImage } from '../../../features/news/og-image';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/news/[slug]/opengraph-image.tsx, at the path Next
// served it from (the `-5nvrt4` suffix: see @utils/og/og-image-route). The worker stamps
// the `cms` policy; a publish purges it with the page.
export const GET: APIRoute = async ({ params }) => renderNewsOgImage(params.slug ?? '');
