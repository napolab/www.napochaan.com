import { OG_IMAGE_ROUTE_SUFFIX } from '../../../../src/utils/og/og-image-route';
import { resolveCacheControl } from '../../../middleware/cache-control';

type NegotiableRequest = { method: string; pathname: string };

const isReadMethod = (method: string): boolean => method === 'GET' || method === 'HEAD';

// A path whose last segment carries an extension (`.md`, `.txt`, `.xml`, `.png`) is a
// representation of its own and is never negotiated.
const hasExtension = (pathname: string): boolean => (pathname.split('/').at(-1) ?? '').includes('.');

// `/<section>/<slug>/opengraph-image-<suffix>` is an extension-less image route, not a
// page: it has no Markdown twin, and varying it on Accept would split the image cache.
const OG_IMAGE_SEGMENTS: readonly string[] = Object.values(OG_IMAGE_ROUTE_SUFFIX).map((suffix) => `opengraph-image-${suffix}`);

const isOGImagePath = (pathname: string): boolean => OG_IMAGE_SEGMENTS.includes(pathname.split('/').at(-1) ?? '');

// Only `page`-kind paths (cacheable HTML pages): drafts / api / internals are left alone.
const isPagePath = (pathname: string): boolean => resolveCacheControl(pathname).kind === 'page';

// Shared by the Astro handler (which representation to render) and the `varyAccept`
// middleware (which responses vary on Accept), so the two can never drift.
export const isNegotiablePath = ({ method, pathname }: NegotiableRequest): boolean => isReadMethod(method) && !hasExtension(pathname) && !isOGImagePath(pathname) && isPagePath(pathname);
