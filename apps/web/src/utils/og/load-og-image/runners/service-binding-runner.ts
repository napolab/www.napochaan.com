import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import { detectImageType, isPayloadMedia, toBase64 } from '../helpers';

import { cmsMediaRequest, mediaFilenameOf } from '@utils/cms-media-request';

import type { OgImageRunner } from '../types';

// Same-origin Payload media. Satori can't be handed the public URL: in the
// worker a fetch of its own hostname hits the edge/ASSETS layer and 404s, and
// under `astro dev` / `wrangler dev` the request origin is localhost, not a reachable public URL. So read
// the original from the cms Worker's `/media/:filename` over the CMS Service
// Binding (available in both) and inline the bytes as a data: URL.
const toDataUrl = async (response: Response): Promise<string | undefined> => {
  if (!response.ok) return undefined;

  const buffer = await response.arrayBuffer();
  const type = detectImageType(buffer);
  if (type === undefined) return undefined; // Satori-unsupported → no-image (GoL) fallback

  return `data:image/${type};base64,${toBase64(buffer)}`;
};

export const serviceBindingRunner: OgImageRunner = {
  run: (ctx) => {
    if (!isPayloadMedia(ctx.absolute, ctx.origin)) return errAsync(undefined);

    const cms = ctx.env.CMS;
    if (cms === undefined) return okAsync(ctx.absolute); // no binding → best-effort direct fetch

    const filename = mediaFilenameOf(new URL(ctx.absolute).pathname);
    if (filename === undefined) return okAsync(undefined);

    return ResultAsync.fromPromise(cms.fetch(cmsMediaRequest(filename)).then(toDataUrl), () => undefined);
  },
};
