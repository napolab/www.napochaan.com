import { errAsync, okAsync } from 'neverthrow';

import { isPayloadMedia } from '../helpers';

import type { OgImageRunner } from '../types';

// Non-payload-media (cross-origin or non-media same-origin) → Satori fetches the
// URL directly; pass it through unchanged.
export const externalRunner: OgImageRunner = {
  run: (ctx) => (isPayloadMedia(ctx.absolute, ctx.origin) ? errAsync(undefined) : okAsync(ctx.absolute)),
};
