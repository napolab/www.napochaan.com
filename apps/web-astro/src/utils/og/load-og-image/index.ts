import { getRequestContext } from '@lib/request-context';

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

  const { env } = getRequestContext();
  const ctx: OgImageContext = {
    absolute,
    origin,
    env,
  };

  return resolveOgImage(ctx);
};
