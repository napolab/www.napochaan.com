import { Hono } from 'hono';

import { notFound } from '../../responses';

import type { CMSServices } from '../../../services/index';

export const mediaRoute = (services: CMSServices) =>
  new Hono().get('/:filename', async (c) => {
    const file = await services.media.file(c.req.param('filename'));
    if (!file) return notFound(c);
    return new Response(file.body, {
      status: 200,
      headers: { 'Content-Type': file.contentType, 'Content-Length': `${file.size}`, ETag: file.etag },
    });
  });
