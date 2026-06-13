import { errAsync, okAsync } from 'neverthrow';

import { isPayloadMedia } from '../helpers';

import type { OgImageRunner } from '../types';

// Dev: next dev serves /api/media/file at the request origin and no self-ref
// worker runs, so Satori can fetch the absolute URL directly.
export const devRunner: OgImageRunner = {
  run: (ctx) => {
    if (!isPayloadMedia(ctx.absolute, ctx.origin) || !ctx.isDev) return errAsync(undefined);

    return okAsync(ctx.absolute);
  },
};
