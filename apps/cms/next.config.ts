import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next writes AGENTS.md into the package on `next dev` otherwise; this repo manages agent docs itself.
  agentRules: false,
  poweredByHeader: false,
  serverExternalPackages: ['drizzle-kit', 'esbuild', 'esbuild-register'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPayload(nextConfig);

// `initOpenNextCloudflareForDev` boots miniflare so `getCloudflareContext` works under
// `next dev`. Gate on NODE_ENV: during `next build` parallel workers would each boot
// miniflare and deadlock on the shared local SQLite state (apps/web did the same before it moved to Astro).
if (process.env.NODE_ENV === 'development') {
  void initOpenNextCloudflareForDev({ environment: process.env.CLOUDFLARE_ENV });
}
