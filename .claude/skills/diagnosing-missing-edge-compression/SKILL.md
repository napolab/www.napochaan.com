---
name: diagnosing-missing-edge-compression
description: Use when a response served through Cloudflare (Workers/OpenNext) arrives uncompressed — no content-encoding header, transferred size equals raw size despite Accept-Encoding gzip/br/zstd — or when auditing transfer sizes shows full-size HTML/JS.
---

# Diagnosing Missing Edge Compression on Cloudflare

## Overview

**Cloudflare's edge refuses to transform (= compress) any response carrying a strong ETag.** A strong ETag (`"abc"`, no `W/` prefix) promises byte-identity; compressing would break that promise, so the edge skips compression entirely. This is the #1 cause of uncompressed responses behind Cloudflare and it applies to Worker-generated responses AND Workers Static Assets.

Facts that counter the usual wrong guesses:

- Cloudflare **does** auto-compress Worker-generated responses (gzip/br/zstd, per Accept-Encoding). No CompressionStream, no in-worker compression needed.
- Workers Static Assets are **not** "uncompressed by design" — their default strong ETag is what blocks compression.
- An explicit `Content-Encoding: identity` from the origin/worker also blocks it (OpenNext sets this only for `localhost` — a wrangler-dev workaround, irrelevant in production).
- Zone toggles (Brotli setting) are almost never the cause.

## Verify (before theorizing)

```bash
# Same size with and without Accept-Encoding == not compressed. Trust bytes, not headers.
curl -s -o /dev/null -w '%{size_download}\n' https://site/
curl -s -H 'Accept-Encoding: gzip, br' -o /dev/null -w '%{size_download}\n' https://site/
```

Then correlate: list several routes' `etag` / `content-encoding` headers. In this repo's incident, every route WITH a strong ETag was uncompressed and every route WITHOUT one was zstd'd — that correlation is the proof.

## Fixes (this repo's shipped pattern, PR #37)

| Path | Fix | Why this shape |
|---|---|---|
| Worker-rendered (HTML/ISR) | Rewrite ETag to weak `W/"..."` in `worker/middleware/weaken-etag.ts` (Hono, post-`next()` `c.header()`) | Weak ETag keeps If-None-Match 304s while permitting transforms |
| `/_next/static/*` assets | `public/_headers`: `! ETag` + `Cache-Control: public, max-age=31536000, immutable` | Workers Assets serve BEFORE the worker runs — no middleware can reach them. Hashed URLs need no validator; removing ETag without adding `immutable` would regress to full re-downloads |
| Unhashed public assets (og images) | Leave alone | Stable URLs need ETag 304s; images are incompressible anyway |

## Common Mistakes

- Adding in-worker CompressionStream — unnecessary; fix the ETag instead.
- Removing an asset ETag without upgrading Cache-Control to `immutable` — kills 304 revalidation.
- Judging a deploy "broken" from headers fetched < 1 min after deploy — Worker version propagation lags; re-check after a minute.
- Reasoning from headers alone — always compare transferred byte counts.
