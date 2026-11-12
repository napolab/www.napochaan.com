import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { forbidden, notFound } from '../../responses';
import { previewHeaderSchema } from '../../schemas';

import type { CMSServices } from '../../../services/index';

const header = zValidator('header', previewHeaderSchema);

// Every handler verifies the preview secret before touching a draft service.
export const draftsRoute = (services: CMSServices) => {
  const isAuthorized = (secret: string) => services.preview.verify(secret);

  return new Hono()
    .get('/blog/:id', header, async (c) => {
      if (!isAuthorized(c.req.valid('header')['x-preview-secret'])) return forbidden(c);
      const post = await services.blog.draft(c.req.param('id'));
      if (!post) return notFound(c);
      return c.json(post, 200);
    })
    .get('/news/:id', header, async (c) => {
      if (!isAuthorized(c.req.valid('header')['x-preview-secret'])) return forbidden(c);
      const item = await services.news.draft(c.req.param('id'));
      if (!item) return notFound(c);
      return c.json(item, 200);
    })
    .get('/works/:id', header, async (c) => {
      if (!isAuthorized(c.req.valid('header')['x-preview-secret'])) return forbidden(c);
      const work = await services.works.draft(c.req.param('id'));
      if (!work) return notFound(c);
      return c.json(work, 200);
    })
    .get('/gallery', header, async (c) => {
      if (!isAuthorized(c.req.valid('header')['x-preview-secret'])) return forbidden(c);
      return c.json(await services.gallery.draftList(), 200);
    })
    .get('/logs', header, async (c) => {
      if (!isAuthorized(c.req.valid('header')['x-preview-secret'])) return forbidden(c);
      return c.json(await services.logs.draftList(), 200);
    });
};
