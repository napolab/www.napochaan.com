import { Hono } from 'hono';

import { notFound } from '../../responses';

import type { CMSServices } from '../../../services/index';

export const worksRoute = (services: CMSServices) =>
  new Hono()
    .get('/', async (c) => c.json(await services.works.list(), 200))
    .get('/:slug', async (c) => {
      const work = await services.works.bySlug(c.req.param('slug'));
      if (!work) return notFound(c);
      return c.json(work, 200);
    });
