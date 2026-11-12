import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { notFound } from '../../responses';
import { newsListQuerySchema } from '../../schemas';

import type { CMSServices } from '../../../services/index';

// The latest-N read is a `limit` query on the list route (not a `/latest`
// segment), so `/:slug` owns every slug — including one named `latest`.
export const newsRoute = (services: CMSServices) =>
  new Hono()
    .get('/', zValidator('query', newsListQuerySchema), async (c) => {
      const { limit } = c.req.valid('query');
      if (limit === undefined) return c.json(await services.news.list(), 200);
      return c.json(await services.news.latest(limit), 200);
    })
    .get('/:slug', async (c) => {
      const item = await services.news.bySlug(c.req.param('slug'));
      if (!item) return notFound(c);
      return c.json(item, 200);
    });
