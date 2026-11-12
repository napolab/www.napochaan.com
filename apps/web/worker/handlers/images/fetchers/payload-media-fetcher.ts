import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import { cmsMediaRequest, mediaFilenameOf } from '../../../../src/utils/cms-media-request';

import type { ImageFetcher } from './types';

const notFound = (): Response => new Response('Not Found', { status: 404 });

// Same-origin `/api/media/file/<filename>` → the cms Worker's `/media/:filename`
// over the CMS Service Binding (originals live in the cms R2 bucket). The R2 body
// stream is handed straight to IMAGES.input(). A cms 404 is passed through.
export const payloadMediaFetcher: ImageFetcher = {
  run: (ctx) => {
    if (ctx.url.origin !== ctx.origin || !ctx.url.pathname.startsWith('/api/media/file/')) return errAsync(undefined);

    const cms = ctx.env.CMS;
    if (cms === undefined) return errAsync(undefined);

    const filename = mediaFilenameOf(ctx.url.pathname);
    if (filename === undefined) return okAsync(notFound());

    return ResultAsync.fromPromise(cms.fetch(cmsMediaRequest(filename)), () => undefined);
  },
};
