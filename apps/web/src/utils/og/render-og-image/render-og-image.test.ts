import { readFile } from 'node:fs/promises';

import { describe, expect, it, vi } from 'vitest';

import { resolveOgCardData } from '../resolve-og-card-data';
import { renderOgImage } from './index';

import type { OgAssets } from '../load-og-assets';

// The worker imports these as precompiled modules (../wasm); node compiles the same files.
vi.mock('../wasm', async () => {
  const { createRequire } = await import('node:module');
  const resolve = createRequire(import.meta.url).resolve;
  const compile = async (specifier: string) => WebAssembly.compile(await readFile(resolve(specifier)));
  const [yoga, resvg] = await Promise.all([compile('satori/yoga.wasm'), compile('@resvg/resvg-wasm/index_bg.wasm')]);

  return { OG_WASM: { yoga, resvg } };
});

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

const loadAssets = async (): Promise<OgAssets> => {
  const publicFile = (name: string) => readFile(new URL(`../../../../public/og/${name}`, import.meta.url));
  const [jp, mono, wordmark] = await Promise.all([publicFile('LINESeedJP-Bold.otf'), publicFile('GeistMono-subset.ttf'), publicFile('wordmark.png')]);

  return {
    fonts: [
      { name: 'LINE Seed JP', data: toArrayBuffer(jp), weight: 700, style: 'normal' },
      { name: 'Geist Mono', data: toArrayBuffer(mono), weight: 400, style: 'normal' },
    ],
    wordmarkUrl: `data:image/png;base64,${wordmark.toString('base64')}`,
  };
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Width / height from the IHDR chunk, which always follows the 8-byte signature.
const readIHDR = (bytes: Uint8Array): { width: number; height: number; chunk: string } => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return { chunk: new TextDecoder().decode(bytes.slice(12, 16)), width: view.getUint32(16), height: view.getUint32(20) };
};

describe('renderOgImage', () => {
  it('renders the text-only card as a 1200x630 PNG', async () => {
    const card = resolveOgCardData({ section: 'blog', title: 'Cannelloni を作っている', meta: '2026.11.01 · blog' });
    const res = await renderOgImage(card, await loadAssets());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(readIHDR(bytes)).toEqual({ chunk: 'IHDR', width: 1200, height: 630 });
  });

  it('renders the image card with the same size (wasm initialised once per isolate)', async () => {
    const assets = await loadAssets();
    const card = resolveOgCardData({ section: 'blog', title: 'with image', meta: 'm', imageUrl: assets.wordmarkUrl });
    const bytes = new Uint8Array(await (await renderOgImage(card, assets)).arrayBuffer());
    expect(readIHDR(bytes)).toEqual({ chunk: 'IHDR', width: 1200, height: 630 });
  });
});
