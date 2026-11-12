import { createMiddleware } from 'hono/factory';

import { createRunner } from '../../lib/first-match-runner';
import { allOf, equals, isIn, not, on } from '../../lib/predicate';
import { PAGE_CACHE_POLICIES } from '../../../src/utils/cache-control';
import { KEEP } from './directives';
import { cmsPlugin } from './plugins/cms';
import { mediaPlugin } from './plugins/media';
import { nextInternalPlugin } from './plugins/next-internal';
import { timeSensitivePlugin } from './plugins/time-sensitive';
import { uncacheablePlugin } from './plugins/uncacheable';

import type { CMSHealthVariables } from '../../lib/cms-health';
import type { Predicate } from '../../lib/predicate';
import type { CacheDirective } from './types';
import type { Context } from 'hono';

// 先頭から順に照合し、最初に match した plugin の directive を採る(first match wins)。
// 具体的なものを先に置く: uncacheable(`/log/preview`)と time-sensitive(`/log`)は cms(catch-all)より前。
const plugins = [nextInternalPlugin, mediaPlugin, uncacheablePlugin, timeSensitivePlugin, cmsPlugin] as const;

const runPlugins = createRunner(plugins);

// pathname は percent-decode せずに渡す(decode が要る判定は plugin 側の orDecoded)。
export const resolveCacheControl = (pathname: string): CacheDirective => runPlugins(pathname).unwrapOr(KEEP);

export const isOK: Predicate<Response> = on((response: Response) => response.status, equals(200));

export const hasUpstreamCacheControl: Predicate<Response> = on(
  (response: Response) => response.headers,
  (headers) => headers.has('Cache-Control'),
);

// cookie を設定する応答は共有してはならない。
export const setsCookie: Predicate<Response> = on(
  (response: Response) => response.headers,
  (headers) => headers.has('Set-Cookie'),
);

// fill: 上流の policy があればそれが勝つ。
export const isShareable: Predicate<Response> = allOf(isOK, not(hasUpstreamCacheControl), not(setsCookie));

// page: Next の force-dynamic が付ける `private, no-cache, no-store, …` は上書きする。
export const isPageCacheable: Predicate<Response> = allOf(isOK, not(setsCookie));

// Server Action の POST などは上書きしない。
const isReadMethod: Predicate<string> = isIn(['GET', 'HEAD']);

const policyFor = (c: Context, directive: CacheDirective): string | undefined => {
  switch (directive.kind) {
    case 'keep':
      return undefined;
    case 'deny':
      return directive.policy;
    case 'fill':
      return isShareable(c.res) ? directive.policy : undefined;
    case 'page':
      return isReadMethod(c.req.method) && isPageCacheable(c.res) ? directive.policy : undefined;
  }
};

// Post-finalization c.header() rebuilds the response, which handles the immutable headers
// of mounted handler responses and redirects (see weaken-etag.ts).
export const cacheControlHeaders = () =>
  createMiddleware<{ Variables: CMSHealthVariables }>(async (c, next) => {
    await next();

    // A render whose CMS read threw or got a 5xx must never be stored, whatever its path.
    if (c.get('cmsDegraded') === true) {
      c.header('Cache-Control', PAGE_CACHE_POLICIES.uncacheable);
      return;
    }

    const policy = policyFor(c, resolveCacheControl(new URL(c.req.url).pathname));
    if (policy === undefined) return;

    c.header('Cache-Control', policy);
  });
