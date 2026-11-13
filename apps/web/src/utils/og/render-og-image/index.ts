import { initWasm, Resvg } from '@resvg/resvg-wasm';
import satori, { init as initSatori } from 'satori/standalone';

import { CONTENT_TYPE, OgCard, SIZE } from '../og-card';
import { ogLifeBoard } from '../og-life-board';
import { OG_WASM } from '../wasm';

import type { OgAssets } from '../load-og-assets';
import type { OgCardData } from '../resolve-og-card-data';

// Port of next/og's ImageResponse pipeline (@vercel/og: satori → resvg, PNG fit to the
// card width), with the wasm modules handed over precompiled (see ../wasm). Shared by
// every detail section's OG route (blog / news / works).

const FIELD_COLS = Math.ceil(SIZE.width / 56);
const FIELD_ROWS = Math.ceil(SIZE.height / 56);

const initAll = async (): Promise<void> => {
  await Promise.all([initSatori(OG_WASM.yoga), initWasm(OG_WASM.resvg)]);
};

// Both inits are once per isolate (resvg's initWasm throws when called twice).
const wasm: { ready?: Promise<void> } = {};

const ensureWasm = (): Promise<void> => {
  wasm.ready ??= initAll();

  return wasm.ready;
};

// Copied into an ArrayBuffer-backed view: resvg's buffer type is not a BodyInit.
const toPNG = (svg: string): Uint8Array<ArrayBuffer> => {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE.width } });
  const rendered = resvg.render();
  const png = rendered.asPng();
  rendered.free();
  resvg.free();

  return new Uint8Array(png);
};

export const renderOgImage = async (card: OgCardData, assets: OgAssets): Promise<Response> => {
  await ensureWasm();
  // Fixed seed: every card shares the same faint Game-of-Life texture.
  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS);
  const svg = await satori(OgCard({ data: card, wordmarkUrl: assets.wordmarkUrl, board }), { ...SIZE, fonts: assets.fonts });

  return new Response(toPNG(svg), { headers: { 'content-type': CONTENT_TYPE } });
};
