import { Hono } from 'hono';

import type { CMSServices } from '../../../services/index';

export const galleryRoute = (services: CMSServices) => new Hono().get('/', async (c) => c.json(await services.gallery.list(), 200));
