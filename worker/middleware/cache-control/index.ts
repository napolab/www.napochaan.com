import { createMiddleware } from 'hono/factory';

import { createRunner } from '../../lib/first-match-runner';
import { allOf, equals, not, on } from '../../lib/predicate';
import { apiPlugin } from './plugins/api';
import { mcpPlugin } from './plugins/mcp';
import { mediaPlugin } from './plugins/media';
import { textFeedPlugin } from './plugins/text-feed';

import type { Predicate } from '../../lib/predicate';
import type { Context } from 'hono';

export { MEDIA_POLICY, PRIVATE_POLICY, TEXT_FEED_POLICY } from './policies';

// 先頭から順に照合し、最初に match した plugin の policy を採る(first match wins)。
// 具体的なものを先に置く: media(`/api/media/file/`)は api(`/api/`)の部分集合なので、
// 後ろに置くと api に先に match して media が private, no-store になってしまう。
// mcp(`/mcp`)は api(`/api/`)と重ならないので順序は効かないが、同じ private 系として api の隣に置く。
const plugins = [mediaPlugin, apiPlugin, mcpPlugin, textFeedPlugin] as const;

const runPlugins = createRunner(plugins);

// pathname は percent-decode しない(Workers Cache のキーと同じ生の値で判定する)。
export const resolveCacheControl = (pathname: string): string | undefined => runPlugins(pathname).unwrapOr(undefined);

export const isOK: Predicate<Response> = on((response: Response) => response.status, equals(200));

// 上流の policy(Next の draft/dynamic の `private, no-store` など)は常に勝つ。
export const hasUpstreamCacheControl: Predicate<Response> = on(
  (response: Response) => response.headers,
  (headers) => headers.has('Cache-Control'),
);

// cookie を設定する応答は共有してはならない。
export const setsCookie: Predicate<Response> = on(
  (response: Response) => response.headers,
  (headers) => headers.has('Set-Cookie'),
);

export const isShareable: Predicate<Response> = allOf(isOK, not(hasUpstreamCacheControl), not(setsCookie));

const applyCacheControl = (c: Context, policy: string): void => {
  c.header('Cache-Control', policy);
};

export const cacheControlHeaders = () =>
  createMiddleware(async (c, next) => {
    await next();

    const policy = resolveCacheControl(new URL(c.req.url).pathname);
    if (policy === undefined) return;
    if (!isShareable(c.res)) return;

    applyCacheControl(c, policy);
  });
