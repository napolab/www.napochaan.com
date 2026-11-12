import { toMediaKey } from './media-key';

import type { CMSServices } from '@napochaan/cms-api/services';

export const createMediaService = (bucket: R2Bucket): CMSServices['media'] => ({
  async file(filename) {
    const key = toMediaKey(filename);
    if (key === undefined) return undefined;

    const object = await bucket.get(key);
    if (!object) return undefined;

    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
      size: object.size,
      etag: object.httpEtag,
    };
  },
});
