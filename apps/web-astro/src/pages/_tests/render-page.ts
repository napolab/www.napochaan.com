import { getContainerRenderer as reactContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

export const ORIGIN = 'http://localhost:8788';

const createContainer = async () => AstroContainer.create({ renderers: await loadRenderers([reactContainerRenderer()]) });

type ExtraRoutes = Record<string, AstroComponentFactory>;

// Full-page render (not a partial) of a route component at `pathname`. `routes` are
// registered for `Astro.rewrite` targets (e.g. `/404`).
export const renderPage = async (page: AstroComponentFactory, pathname: string, routes: ExtraRoutes = {}): Promise<Response> => {
  const container = await createContainer();
  for (const [route, component] of Object.entries(routes)) {
    container.insertPageRoute(route, component);
  }

  return container.renderToResponse(page, { request: new Request(`${ORIGIN}${pathname}`), partial: false });
};

// An endpoint module (`export const GET`) rendered through the container.
export const renderEndpoint = async (endpoint: AstroComponentFactory, pathname: string): Promise<Response> => {
  const container = await createContainer();

  return container.renderToResponse(endpoint, { request: new Request(`${ORIGIN}${pathname}`), routeType: 'endpoint' });
};
