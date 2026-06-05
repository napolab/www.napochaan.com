import { errAsync, ResultAsync } from 'neverthrow';

import { isInternalAsset } from '../helpers';

import type { ImageFetcher } from './types';

export const internalAssetFetcher: ImageFetcher = {
  run: (ctx) => {
    if (!isInternalAsset(ctx.url, ctx.origin)) {
      return errAsync(undefined);
    }
    const response = ctx.env.ASSETS?.fetch(ctx.fetchUrl, ctx.fetchOptions);
    if (response === undefined) {
      return errAsync(undefined);
    }
    return ResultAsync.fromPromise(response, () => undefined);
  },
};
