import { withPayload } from '../rpc/local-payload';
import { createBlogService } from './blog';
import { createGalleryService } from './gallery';
import { createLogsService } from './logs';
import { createNewsService } from './news';
import { createProfileService } from './profile';
import { createWorksService } from './works';

import type { PayloadRunner } from './payload-runner';
import type { CMSServices } from '@napochaan/cms-api/services';

// Composition root: binds every service to a Payload runner scoped to this
// request's Cloudflare env/ctx. `media` and `preview` are stubs until Task 5.
export const createPayloadServices = (env: CloudflareEnv, ctx: ExecutionContext): CMSServices => {
  const run: PayloadRunner = async (fn) => withPayload(env, ctx, fn);

  return {
    blog: createBlogService(run),
    news: createNewsService(run),
    works: createWorksService(run),
    gallery: createGalleryService(run),
    logs: createLogsService(run),
    profile: createProfileService(run),
    media: { file: async () => undefined },
    preview: { verify: () => false },
  };
};
