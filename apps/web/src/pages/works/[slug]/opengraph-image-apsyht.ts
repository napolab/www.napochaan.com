import { renderWorkOgImage } from '../../../features/works/og-image';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/works/[slug]/opengraph-image.tsx, at the path Next
// served it from (the `-apsyht` suffix: see @utils/og/og-image-route). The worker stamps
// the `cms` policy; a publish purges it with the page.
export const GET: APIRoute = async ({ params }) => renderWorkOgImage(params.slug ?? '');
