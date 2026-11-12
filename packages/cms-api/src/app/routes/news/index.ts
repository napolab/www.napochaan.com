import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { notFound } from '../../responses';
import { latestQuerySchema } from '../../schemas';

import type { CMSServices } from '../../../services/index';

// `/latest` must be registered before `/:slug` so it is not captured as a slug.
export const newsRoute = (services: CMSServices) =>
  new Hono()
    .get('/', async (c) => c.json(await services.news.list(), 200))
    .get('/latest', zValidator('query', latestQuerySchema), async (c) => c.json(await services.news.latest(c.req.valid('query').limit), 200))
    .get('/:slug', async (c) => {
      const item = await services.news.bySlug(c.req.param('slug'));
      if (!item) return notFound(c);
      return c.json(item, 200);
    });
