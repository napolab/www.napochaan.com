import { renderBlogOgImage } from '../../../features/blog/og-image';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/blog/[slug]/opengraph-image.tsx, at the path Next
// served it from (the `-fx5gi7` suffix: see @utils/og/og-image-route). The worker stamps
// the `cms` policy; a publish purges it with the page.
export const GET: APIRoute = async ({ params }) => renderBlogOgImage(params.slug ?? '');
