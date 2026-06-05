import { errAsync, ResultAsync } from 'neverthrow';

import type { ImageFetcher } from './types';

export const payloadMediaFetcher: ImageFetcher = {
  run: (ctx) => {
    if (!ctx.url.pathname.startsWith('/api/media/file/') || ctx.url.origin !== ctx.origin) {
      return errAsync(undefined);
    }
    const response = ctx.env.WORKER_SELF_REFERENCE?.fetch(ctx.fetchUrl, ctx.fetchOptions);
    if (response === undefined) {
      return errAsync(undefined);
    }
    return ResultAsync.fromPromise(response, () => undefined);
  },
};
