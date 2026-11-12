import { ResultAsync } from 'neverthrow';

import type { ImageFetcher } from './types';

export const externalFetcher: ImageFetcher = {
  run: (ctx) => ResultAsync.fromPromise(fetch(ctx.fetchUrl, ctx.fetchOptions), () => undefined),
};
