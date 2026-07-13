import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The client-side Router Cache reuses already-visited RSC entries on soft
  // navigation (and back/forward) WITHOUT refetching — and server-side
  // `revalidateTag` never evicts it. So a long-open tab keeps serving the RSC it
  // cached earlier, showing an out-of-date version of a work until a hard reload
  // discards the client cache. Setting both reuse windows to 0 marks every cached
  // segment immediately stale, so each navigation re-pulls fresh RSC from the
  // server. Trade-off: back/forward refetch instead of instant-reusing the cache.
  experimental: {
    staleTimes: { static: 0, dynamic: 0 },
  },
  serverExternalPackages: ['drizzle-kit', 'esbuild', 'esbuild-register'],
  redirects: async () => [
    // The public route is /log (the CMS collection slug is `logs`, so /logs is a
    // natural guess). Exact match only — /log has no detail pages, so there is
    // nothing meaningful to map sub-paths onto. Placeholder rules (`:path*`) are
    // also risky here: OpenNext's routing layer skips destination compilation
    // when the source match yields no params, leaving a literal ":path*" in the
    // Location header (bit us on staging).
    {
      source: '/logs',
      destination: '/log',
      permanent: true,
    },
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              ref: true,
              svgoConfig: {
                plugins: [{ name: 'preset-default', params: { overrides: { prefixIds: false } } }],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            ref: true,
            svgoConfig: {
              plugins: [{ name: 'preset-default', params: { overrides: { prefixIds: false } } }],
            },
          },
        },
      ],
    });
    return config;
  },
};

export default withPayload(nextConfig);

// `initOpenNextCloudflareForDev` boots a miniflare instance so `getCloudflareContext`
// works while running `next dev`. It must run ONLY in the dev server: during
// `next build` the build spawns parallel workers that would each boot miniflare and
// deadlock on the shared local Durable Object SQLite state (SQLITE_BUSY). Gate on
// NODE_ENV (`next dev` => development, `next build` => production) — NEXT_PHASE is
// not yet set when this config module is first evaluated. The production build path
// is `opennextjs-cloudflare build`, which provides its own runtime context.
if (process.env.NODE_ENV === 'development') {
  void initOpenNextCloudflareForDev({ environment: process.env.CLOUDFLARE_ENV });
}
