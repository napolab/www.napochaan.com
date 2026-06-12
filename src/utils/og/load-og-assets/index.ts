import { getCloudflareContext } from '@opennextjs/cloudflare';

// Loads the OG card's binary assets (fonts + digibop wordmark) from the worker's
// ASSETS binding rather than over the network. Fetching via the binding works in
// `opennextjs-cloudflare preview` and production alike, where BASE_URL points at
// the public domain (which would 404 these worker-local files). Fonts are handed
// to Satori as ArrayBuffers; the wordmark is inlined as a data: URL so Satori
// never performs its own fetch.

export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' };
export type OgAssets = { fonts: OgFont[]; wordmarkUrl: string };

// The host is irrelevant to the ASSETS binding — only the path is matched.
const ASSET_ORIGIN = 'https://assets.local';

const fetchAsset = async (assets: Fetcher, path: string): Promise<ArrayBuffer> => {
  const response = await assets.fetch(`${ASSET_ORIGIN}${path}`);
  if (!response.ok) throw new Error(`OG asset ${path} failed: ${response.status}`);

  return response.arrayBuffer();
};

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

  return btoa(binary);
};

export const loadOgAssets = async (): Promise<OgAssets> => {
  const assets = getCloudflareContext().env.ASSETS;
  if (assets === undefined) throw new Error('OG assets: ASSETS binding unavailable');

  const [jp, mono, wordmark] = await Promise.all([fetchAsset(assets, '/og/LINESeedJP-Bold.otf'), fetchAsset(assets, '/og/GeistMono-subset.ttf'), fetchAsset(assets, '/og/wordmark.png')]);

  return {
    fonts: [
      { name: 'LINE Seed JP', data: jp, weight: 700, style: 'normal' },
      { name: 'Geist Mono', data: mono, weight: 400, style: 'normal' },
    ],
    wordmarkUrl: `data:image/png;base64,${toBase64(wordmark)}`,
  };
};
