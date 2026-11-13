import { getContainerRenderer as reactContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

export const ORIGIN = 'http://localhost:8788';

const createContainer = async () => AstroContainer.create({ renderers: await loadRenderers([reactContainerRenderer()]) });

type ExtraRoutes = Record<string, AstroComponentFactory>;

// A dynamic route's `Astro.params` (the container does not match the pathname
// against the route pattern, so tests pass what the router would extract).
type Params = Record<string, string | undefined>;

// Full-page render (not a partial) of a route component at `pathname`. `routes` are
// registered for `Astro.rewrite` targets (e.g. `/404`).
export const renderPage = async (page: AstroComponentFactory, pathname: string, routes: ExtraRoutes = {}, params: Params = {}): Promise<Response> => {
  const container = await createContainer();
  for (const [route, component] of Object.entries(routes)) {
    container.insertPageRoute(route, component);
  }

  return container.renderToResponse(page, { request: new Request(`${ORIGIN}${pathname}`), partial: false, params });
};

// An endpoint module (`export const GET`) rendered through the container.
export const renderEndpoint = async (endpoint: AstroComponentFactory, pathname: string, params: Params = {}): Promise<Response> => {
  const container = await createContainer();

  return container.renderToResponse(endpoint, { request: new Request(`${ORIGIN}${pathname}`), routeType: 'endpoint', params });
};

type ComponentRenderOptions = {
  pathname?: string;
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
};

// A component (partial) render, for `*.astro.test.ts` next to an `.astro` component.
export const renderComponent = async (component: AstroComponentFactory, { pathname = '/', props = {}, slots = {} }: ComponentRenderOptions = {}): Promise<string> => {
  const container = await createContainer();

  return container.renderToString(component, { request: new Request(`${ORIGIN}${pathname}`), props, slots });
};
