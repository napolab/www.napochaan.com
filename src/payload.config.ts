import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { r2Storage } from '@payloadcms/storage-r2';
import { buildConfig } from 'payload';

import { Blog } from './collections/blog';
import { Gallery } from './collections/gallery';
import { Media } from './collections/media';
import { News } from './collections/news';
import { Users } from './collections/users';
import { Works } from './collections/works';
import { createPreviewURLFactory, draftPreviewRoute } from './lib/payload/create-preview-url-factory';

import type { CloudflareContext } from '@opennextjs/cloudflare';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// ---------------------------------------------------------------------------
// Cloudflare bindings resolution
// ---------------------------------------------------------------------------
// This config is evaluated in three contexts, each resolving its bindings
// (D1, R2, ...) from a different source:
//
//   1. `next build` — Next spawns parallel build workers that each evaluate this
//      module. Booting miniflare (via `getCloudflareContext`) in every worker
//      deadlocks on the shared local SQLite state (SQLITE_BUSY). The build never
//      runs DB/R2 queries (admin/api routes are dynamic; marketing pages don't
//      read Payload), so we hand Payload inert stub bindings. Detected via
//      `NEXT_PHASE`, which IS set in the build worker subprocesses.
//   2. Payload CLI bin scripts (generate / migrate / seed / reset / run) run
//      outside the worker runtime, so they resolve bindings through wrangler's
//      `getPlatformProxy`. Remote bindings are used ONLY for an explicit deploy
//      target (`CLOUDFLARE_ENV=staging|production`); otherwise local miniflare,
//      so the CLI needs no `wrangler login` or real Cloudflare resources.
//   3. `next dev` and the deployed worker — resolve through OpenNext's
//      `getCloudflareContext`, the single shared runtime context.
const deployTarget = process.env.CLOUDFLARE_ENV;
const useRemoteBindings = deployTarget === 'staging' || deployTarget === 'production';
const isPayloadCliInvocation = process.argv.find((value) => value.match(/^(generate|migrate|seed|reset|run):?/)) !== undefined;
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';

const getCloudflareContextFromWrangler = async (): Promise<CloudflareContext> => {
  const { getPlatformProxy } = (await import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`)) as {
    getPlatformProxy: (options: { environment?: string; experimental?: { remoteBindings?: boolean } }) => Promise<CloudflareContext>;
  };
  return getPlatformProxy({
    environment: deployTarget,
    experimental: { remoteBindings: useRemoteBindings },
  });
};

const getBuildStubContext = (): CloudflareContext => ({ env: { D1: {} as D1Database, R2: {} as R2Bucket } as Cloudflare.Env }) as CloudflareContext;

const resolveCloudflareContext = async (): Promise<CloudflareContext> => {
  if (isNextBuild) return getBuildStubContext();
  if (isPayloadCliInvocation) return getCloudflareContextFromWrangler();
  return getCloudflareContext({ async: true });
};

const cloudflare = await resolveCloudflareContext();
const cfEnv = cloudflare.env;

const d1 = cfEnv.D1;
const r2 = cfEnv.R2;
if (d1 === undefined || r2 === undefined) {
  throw new Error('Cloudflare bindings D1/R2 are not available in this context');
}

// PAYLOAD_SECRET signs auth tokens, so it MUST be a real secret at runtime.
// Single source = the Cloudflare env: `getPlatformProxy` / `getCloudflareContext`
// reads `.dev.vars` for both `next dev` and the Payload CLI (migrate/seed), and the
// deployed worker exposes the `wrangler secret` there. The build stub has no secret,
// so the placeholder is allowed ONLY during `next build`; the generated type claims
// `PAYLOAD_SECRET: string`, but that is too optimistic for the build stub, so the
// runtime guards below stay even though they look type-unreachable.
const secret = cfEnv.PAYLOAD_SECRET ?? (isNextBuild ? 'build-time-placeholder-not-used-at-runtime' : undefined);
if (secret === undefined) {
  throw new Error('PAYLOAD_SECRET is required at runtime. Set it via `wrangler secret put PAYLOAD_SECRET`.');
}

// Allowed origin for the admin panel + REST/GraphQL API (CORS) and CSRF
// protection. Driven by the per-environment `BASE_URL` wrangler var.
const serverURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default buildConfig({
  i18n: {
    fallbackLanguage: 'ja',
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: createPreviewURLFactory([
        draftPreviewRoute({
          slug: 'news',
          previewSecret: cfEnv.PREVIEW_SECRET ?? '',
          buildPath: (data) => `/news/preview/${data.id}`,
        }),
        draftPreviewRoute({
          slug: 'works',
          previewSecret: cfEnv.PREVIEW_SECRET ?? '',
          buildPath: (data) => `/works/${data.id}`,
        }),
        draftPreviewRoute({
          slug: 'blog',
          previewSecret: cfEnv.PREVIEW_SECRET ?? '',
          buildPath: (data) => `/blog/${data.id}`,
        }),
        draftPreviewRoute({
          slug: 'gallery',
          previewSecret: cfEnv.PREVIEW_SECRET ?? '',
          buildPath: () => '/gallery',
        }),
      ]),
      collections: ['news', 'works', 'blog', 'gallery'],
    },
    get autoLogin() {
      if (process.env.NODE_ENV !== 'development') return false;

      return {
        email: 'dev@napochaan.com',
        password: 'password',
        prefillOnly: true,
      };
    },
  },
  cors: [serverURL],
  csrf: [serverURL],
  collections: [Users, Media, News, Works, Blog, Gallery],
  editor: lexicalEditor(),
  secret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: d1,
    migrationDir: path.resolve(dirname, '..', 'migrations'),
    push: false,
  }),
  plugins: [
    r2Storage({
      bucket: r2,
      collections: {
        media: true,
      },
    }),
    seoPlugin({
      collections: ['news', 'works', 'blog', 'gallery'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `napochaan — ${doc.title as string}`,
      generateDescription: ({ doc }) => (doc.excerpt as string) ?? '',
    }),
  ],
  // `pnpm payload:seed` (= `payload seed`) runs the named `script` export in
  // src/seed.ts. See https://payloadcms.com/docs/configuration/overview#custom-bin-scripts
  bin: [
    {
      scriptPath: path.resolve(dirname, 'seed.ts'),
      key: 'seed',
    },
  ],
});
