import { getCloudflareContext } from '@opennextjs/cloudflare';

import { absoluteMediaUrl } from '../og-image-url';

import { resolveOgImage } from './runners/combined-runner';

import type { OgImageContext } from './types';

// Resolves a Payload media src to a value next/og's Satori can render in <img src>.
// Runs a registry of runners (external / service-binding); first match wins —
// same plugin shape as worker/handlers/images. See the runners for why same-origin
// media is read from the cms Worker over the CMS Service Binding.
export const loadOgImage = async (src: string | undefined, origin: string): Promise<string | undefined> => {
  const absolute = absoluteMediaUrl(src, origin);
  if (absolute === undefined) return undefined;

  // Async form: the sync one throws outside a request under `next dev`.
  const { env } = await getCloudflareContext({ async: true });
  const ctx: OgImageContext = {
    absolute,
    origin,
    env,
  };

  return resolveOgImage(ctx);
};
