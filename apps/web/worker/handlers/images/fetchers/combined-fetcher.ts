import { externalFetcher } from './external-fetcher';
import { internalAssetFetcher } from './internal-asset-fetcher';
import { payloadMediaFetcher } from './payload-media-fetcher';

import type { FetchContext, ImageFetcher } from './types';

const fetchers: ImageFetcher[] = [internalAssetFetcher, payloadMediaFetcher, externalFetcher];

export const fetchImage = async (ctx: FetchContext): Promise<Response> => {
  for (const fetcher of fetchers) {
    const result = await fetcher.run(ctx);
    if (result.isOk()) {
      return result.value;
    }
  }
  return new Response('Failed to fetch image', { status: 500 });
};
