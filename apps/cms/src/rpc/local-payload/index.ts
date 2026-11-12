import { runWithCloudflareRequestContext as runRequestContext } from '../../../.open-next/cloudflare/init.js';

import type { Payload } from 'payload';

// Pinned to the declared shape because after `opennextjs-cloudflare build`
// TypeScript resolves the real (untyped) JavaScript instead of the declaration in
// `src/rpc/open-next.d.ts`, and infers `(any, any, any, any) => Promise<unknown>`
// for it — not assignable to the generic runner, so a plain annotation is not
// enough. The double assertion is a no-op before a build (the declaration already
// has this type) and the only way to keep typecheck green after one.
const runWithCloudflareRequestContext = runRequestContext as unknown as OpenNextRequestContextRunner;

// Runs `fn` the way OpenNext runs a request: Node's module-scope globals installed,
// `process.env` populated from the bindings (`PAYLOAD_SECRET` among them) and the
// Cloudflare context (env, ctx) available to `getCloudflareContext()`, which the
// Payload config reads. A `CMS` entrypoint call never reaches the OpenNext fetch
// handler, so without this wrapper none of that setup has happened on a cold
// isolate and Payload dies on module evaluation.
//
// `payload` and the config are imported lazily inside the context so their module
// evaluation happens after that setup. `getPayload` caches on `globalThis._payload`,
// so later calls in the isolate reuse the first instance.
//
// The request is synthesised from `CMS_ORIGIN` because OpenNext derives
// `OPEN_NEXT_ORIGIN` from its URL.
export const withPayload = async <T>(env: CloudflareEnv, ctx: ExecutionContext, fn: (payload: Payload) => Promise<T>): Promise<T> =>
  runWithCloudflareRequestContext(new Request(env.CMS_ORIGIN), env, ctx, async () => {
    const [{ getPayload }, { default: config }] = await Promise.all([import('payload'), import('../../payload.config')]);

    return fn(await getPayload({ config }));
  });
