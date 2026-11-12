import { Hono } from 'hono';

import { notFound } from '../../responses';

import type { CMSServices } from '../../../services/index';

export const profileRoute = (services: CMSServices) =>
  new Hono().get('/', async (c) => {
    const profile = await services.profile.get();
    if (!profile) return notFound(c);
    return c.json(profile, 200);
  });
