import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['drizzle-kit', 'esbuild', 'esbuild-register'],
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
