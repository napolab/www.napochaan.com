import { zValidator } from '@hono/zod-validator';
import z from 'zod';

import { factory } from '../factory';

import { fetchImage } from './fetchers';
import { buildFetchUrl, isAllowedUrl, isGifSource, resolveOutputFormat } from './helpers';

import type { FetchContext } from './fetchers';

const Format = z.union([z.literal('avif'), z.literal('webp'), z.literal('jpeg'), z.literal('png'), z.literal('gif')]);

const TransformOptions = z.object({
  url: z.string(),
  blur: z.coerce.number().min(0).max(250).optional(),
  format: Format.optional(),
  height: z.coerce.number().min(0).optional(),
  h: z.coerce.number().min(0).optional(),
  width: z.coerce.number().min(0).optional(),
  w: z.coerce.number().min(0).optional(),
  quality: z.coerce.number().min(0).max(100).optional(),
  q: z.coerce.number().min(0).max(100).optional(),
});

type TransformOptionsType = z.infer<typeof TransformOptions>;

const transformImage = async (images: NonNullable<Cloudflare.Env['IMAGES']>, body: ReadableStream<Uint8Array>, query: TransformOptionsType, accept: string, isGif: boolean) => {
  const transform = await images
    .input(body)
    .transform({
      get width() {
        return query.width ?? query.w;
      },
      get height() {
        return query.height ?? query.h;
      },
      get blur() {
        return query.blur;
      },
    })
    .output({
      get quality() {
        return query.quality ?? query.q;
      },
      get format() {
        return resolveOutputFormat({ explicit: query.format, accept, isGif });
      },
    });

  return transform.response();
};

export const imageHandlers = factory.createHandlers(zValidator('query', TransformOptions), async (c) => {
  const query = c.req.valid('query');
  const accept = c.req.header('accept') ?? '';
  const origin = new URL(c.req.url).origin;
  const url = new URL(query.url, c.req.url);

  if (!isAllowedUrl(url, origin)) {
    return c.json({ error: 'URL not allowed' }, 403);
  }

  const fetchUrl = buildFetchUrl(url, origin);
  const fetchOptions: RequestInit = {};
  const ctx: FetchContext = { url, origin, fetchUrl, env: c.env, fetchOptions };

  const sourceRes = await fetchImage(ctx);

  if (!sourceRes.ok) {
    return c.json(
      {
        error: 'Failed to fetch image source',
        status: sourceRes.status,
        statusText: sourceRes.statusText,
        url: fetchUrl,
      },
      sourceRes.status as 500 | 404,
    );
  }

  const body = sourceRes.body;
  if (!body) return c.json({ error: 'Empty image body' }, 404);

  const images = c.env.IMAGES;
  if (images === undefined) return c.json({ error: 'IMAGES binding unavailable' }, 500);

  const isGif = isGifSource(sourceRes.headers.get('content-type'), url.pathname);

  return transformImage(images, body, query, accept, isGif);
});
