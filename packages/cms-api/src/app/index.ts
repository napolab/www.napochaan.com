import { Hono } from 'hono';

import { blogRoute } from './routes/blog/index';
import { draftsRoute } from './routes/drafts/index';
import { galleryRoute } from './routes/gallery/index';
import { logsRoute } from './routes/logs/index';
import { mediaRoute } from './routes/media/index';
import { newsRoute } from './routes/news/index';
import { profileRoute } from './routes/profile/index';
import { worksRoute } from './routes/works/index';

import type { CMSServices } from '../services/index';

export const createApp = (services: CMSServices) =>
  new Hono()
    .route('/blog', blogRoute(services))
    .route('/news', newsRoute(services))
    .route('/works', worksRoute(services))
    .route('/gallery', galleryRoute(services))
    .route('/logs', logsRoute(services))
    .route('/profile', profileRoute(services))
    .route('/drafts', draftsRoute(services))
    .route('/media', mediaRoute(services));

export type CMSAppType = ReturnType<typeof createApp>;
