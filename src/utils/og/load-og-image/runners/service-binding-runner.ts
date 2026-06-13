import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import { detectImageType, isPayloadMedia, toBase64 } from '../helpers';

import type { OgImageRunner } from '../types';

// Same-origin Payload media in the worker runtime. Satori's global fetch() can't
// reach the worker's own dynamic media route (a worker fetching its public
// hostname hits the edge/ASSETS layer and 404s), so re-enter the worker via the
// WORKER_SELF_REFERENCE service binding and inline the bytes as a data: URL.
const toDataUrl = async (response: Response): Promise<string | undefined> => {
  if (!response.ok) return undefined;

  const buffer = await response.arrayBuffer();
  const type = detectImageType(buffer);
  if (type === undefined) return undefined; // Satori-unsupported → no-image (GoL) fallback

  return `data:image/${type};base64,${toBase64(buffer)}`;
};

export const serviceBindingRunner: OgImageRunner = {
  run: (ctx) => {
    if (!isPayloadMedia(ctx.absolute, ctx.origin) || ctx.isDev) return errAsync(undefined);

    const ref = ctx.env.WORKER_SELF_REFERENCE;
    if (ref === undefined) return okAsync(ctx.absolute); // no binding → best-effort direct fetch

    return ResultAsync.fromPromise(ref.fetch(ctx.absolute).then(toDataUrl), () => undefined);
  },
};
