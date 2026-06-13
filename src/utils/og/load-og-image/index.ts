import { getCloudflareContext } from '@opennextjs/cloudflare';

import { absoluteMediaUrl } from '../og-image-url';

import { resolveOgImage } from './runners/combined-runner';

import type { OgImageContext } from './types';

// Resolves a Payload media src to a value next/og's Satori can render in <img src>.
// Runs a registry of runners (external / dev / service-binding); first match wins —
// same plugin shape as worker/handlers/images. See the runners for why same-origin
// media must re-enter the worker via WORKER_SELF_REFERENCE.
export const loadOgImage = async (src: string | undefined, origin: string): Promise<string | undefined> => {
  const absolute = absoluteMediaUrl(src, origin);
  if (absolute === undefined) return undefined;

  const ctx: OgImageContext = {
    absolute,
    origin,
    isDev: process.env.NODE_ENV === 'development',
    env: getCloudflareContext().env,
  };

  return resolveOgImage(ctx);
};
