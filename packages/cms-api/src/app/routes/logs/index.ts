import { Hono } from 'hono';

import type { CMSServices } from '../../../services/index';

export const logsRoute = (services: CMSServices) => new Hono().get('/', async (c) => c.json(await services.logs.list(), 200));
