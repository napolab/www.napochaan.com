import { Hono } from 'hono';

import { notFound } from '../../responses';

import type { CMSServices } from '../../../services/index';

export const blogRoute = (services: CMSServices) =>
  new Hono()
    .get('/', async (c) => c.json(await services.blog.list(), 200))
    .get('/:slug', async (c) => {
      const post = await services.blog.bySlug(c.req.param('slug'));
      if (!post) return notFound(c);
      return c.json(post, 200);
    });
