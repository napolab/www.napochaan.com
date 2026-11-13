import type { APIRoute } from 'astro';

// Port of the Next `redirects()` entry: the CMS collection slug is `logs`, so /logs is
// a natural guess for /log. Exact path only (/log has no detail pages), permanent 308
// like Next's `permanent: true`, query kept. An endpoint rather than astro.config
// `redirects`: the Cloudflare adapter emits those as an assets `_redirects` file that
// the asset layer answers before the worker, skipping its `no-store` on ≥300.
// `ALL`: Next's redirect answered every method (HEAD, POST, …) with the same 308.
export const ALL: APIRoute = ({ request }) => new Response(null, { status: 308, headers: { Location: `/log${new URL(request.url).search}` } });
