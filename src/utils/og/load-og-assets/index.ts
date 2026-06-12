import { getCloudflareContext } from '@opennextjs/cloudflare';

import { requestOrigin } from '../og-image-url';

// Loads the OG card's binary assets (fonts + digibop wordmark) from the worker's
// ASSETS binding rather than over the network. Fetching via the binding works in
// `opennextjs-cloudflare preview` and production alike, where BASE_URL points at
// the public domain (which would 404 these worker-local files). Fonts are handed
// to Satori as ArrayBuffers; the wordmark is inlined as a data: URL so Satori
// never performs its own fetch.
//
// Dev exception: under `next dev` the ASSETS binding is backed by the unbuilt
// `.open-next/assets` dir, so these files 404 until an `opennextjs-cloudflare
// build` runs. Next still serves `/public` at the dev origin, so in development we
// fall back to fetching the same path from there — OG images render under `next
// dev` with no build step. The fallback is guarded by NODE_ENV and only reached
// when the binding actually 404s, so production/preview never touch it.

export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' };
export type OgAssets = { fonts: OgFont[]; wordmarkUrl: string };

// The host is irrelevant to the ASSETS binding — only the path is matched.
const ASSET_ORIGIN = 'https://assets.local';

const fetchAsset = async (assets: Fetcher, path: string, devOrigin: string | undefined): Promise<ArrayBuffer> => {
  const response = await assets.fetch(`${ASSET_ORIGIN}${path}`);
  if (response.ok) return response.arrayBuffer();

  if (devOrigin !== undefined) {
    const fallback = await fetch(`${devOrigin}${path}`);
    if (fallback.ok) return fallback.arrayBuffer();
  }

  throw new Error(`OG asset ${path} failed: ${response.status}`);
};

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

  return btoa(binary);
};

export const loadOgAssets = async (): Promise<OgAssets> => {
  const assets = getCloudflareContext().env.ASSETS;
  if (assets === undefined) throw new Error('OG assets: ASSETS binding unavailable');

  // Only resolved in dev (see the file header) — the dev-origin fallback target.
  const devOrigin = process.env.NODE_ENV === 'development' ? await requestOrigin() : undefined;
  const [jp, mono, wordmark] = await Promise.all([
    fetchAsset(assets, '/og/LINESeedJP-Bold.otf', devOrigin),
    fetchAsset(assets, '/og/GeistMono-subset.ttf', devOrigin),
    fetchAsset(assets, '/og/wordmark.png', devOrigin),
  ]);

  return {
    fonts: [
      { name: 'LINE Seed JP', data: jp, weight: 700, style: 'normal' },
      { name: 'Geist Mono', data: mono, weight: 400, style: 'normal' },
    ],
    wordmarkUrl: `data:image/png;base64,${toBase64(wordmark)}`,
  };
};
