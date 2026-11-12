# Production deploy runbook

Production is two Workers (CMS split, `docs/superpowers/specs/2026-11-12-cms-split-design.md`):

| Worker | Dir | Host | Role |
| --- | --- | --- | --- |
| `napochaan-cms-production` | `apps/cms` | `cms.napochaan.com` (host-wide Cloudflare Access, `/api/media-upload` Bypass) | Payload admin / REST / MCP / CMS RPC; owns D1 + R2 |
| `napochaan-website-production` | `apps/web` | `napochaan.com` (no Access) | public site, SSR + Workers Cache; reads the cms via the `CMS` Service Binding |

**Deploy order is cms → web** (web's `CMS` binding needs the target to exist; cms's `WEB` binding is best-effort). The root `pnpm deploy:production` runs both in that order. D1 migrations belong to the cms (`pnpm --filter cms deploy:database:production`).

Everything that can be prepared **without** the worker deploy is already done (see
"Done" below). Deploying production is now a short, well-defined sequence.

All `wrangler` / Payload CLI commands need the account id in the environment
(otherwise wrangler prompts for account selection and exits with code 13):

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

## Done (this setup pass — no deploy required)

- **D1 created**: `napochaan-cms-production` (`047f9f80-9805-468e-96d7-77cbcf86cf0d`)
  and `napochaan-cache-production` (`f3f67f2e-3e9d-45e6-b522-de8a90256d36`).
- **R2 created**: `napochaan-cms-production`, `napochaan-cache-production`.
- **wrangler config**: real D1 ids wired into `apps/cms/wrangler.jsonc`
  `env.production`, with the `cms.napochaan.com` custom domain; `apps/web/wrangler.toml`
  `[env.production]` has the `napochaan.com` custom domain (a worker with no route is
  unreachable).
- **package.json**: `deploy:production` and `deploy:database:production` scripts
  in `apps/cms` and `apps/web`, plus root delegating scripts.
- **Schema migrated**: all 8 migrations applied to `napochaan-cms-production`.
- **Content seeded**: `seed:import:prod` loaded 10 news / 42 works / 2 blog /
  32 logs / 12 gallery + the profile global into prod D1, with media uploaded to
  the prod R2 bucket. No admin user is seeded — the production admin is created
  via Payload's first-user onboarding screen after the first deploy.

`napochaan-cache-production` (D1 / R2) was the OpenNext incremental / tag cache of the
old ISR setup. web is now SSR + Workers Cache and no longer binds them; they can be
deleted once nothing references them.

## Remaining steps

### 1. First deploy (creates the workers)

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
pnpm deploy:production   # cms → web, then the post-deploy cache warm-up
```

This builds each app with OpenNext and deploys `napochaan-cms-production` then
`napochaan-website-production`, binds them to `cms.napochaan.com` / `napochaan.com`, and
warms the Workers Cache (`apps/web/scripts/warm-cache.mjs`: sitemap URLs + feeds).

A brand-new Worker name has a circular binding (cms `WEB` ↔ web `CMS`): deploy cms
(without `WEB`) → web → cms (with `WEB`). Existing names deploy in the steady order.
Deleting a Worker that is still referenced needs `--delete-with-references`.

Schema is already migrated, but to re-apply migrations later (after new
`payload:migrate:create`) run:

```bash
CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm deploy:database:production   # = pnpm --filter cms deploy:database:production
```

### 2. Set the production secrets

Secrets attach to a worker, so they can only be set **after** step 1 exists. Each
Worker has its own set; run the `wrangler` commands from the matching app directory.

**cms** (`cd apps/cms`):

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72

wrangler secret put PAYLOAD_SECRET       --env production   # openssl rand -hex 32 — use a NEW value, distinct from staging
wrangler secret put PREVIEW_SECRET       --env production   # openssl rand -hex 32 — live-preview signing (MUST equal web's)
```

**web** (`cd apps/web`):

```bash
wrangler secret put PREVIEW_SECRET       --env production   # same value as cms's PREVIEW_SECRET
wrangler secret put CURSOR_SALT          --env production   # openssl rand -hex 16 — cursor-identity hashing salt
wrangler secret put RESEND_API_KEY       --env production   # Resend API key (contact form email)
wrangler secret put DISCORD_WEBHOOK_URL  --env production   # Discord webhook (contact notify)
wrangler secret put CONTACT_TO_EMAIL     --env production   # contact form recipient
wrangler secret put CONTACT_FROM_EMAIL   --env production   # contact form sender (must be a Resend-verified domain)
wrangler secret put TURNSTILE_SECRET_KEY --env production   # Cloudflare Turnstile server secret
```

Notes:

- `PAYLOAD_SECRET` / `CURSOR_SALT` / `PREVIEW_SECRET` should be freshly generated
  for production (do not copy staging's — production isolation).
- `PREVIEW_SECRET` is shared: cms signs the Live Preview URL, web verifies it.
- `RESEND_API_KEY`, `DISCORD_WEBHOOK_URL`, `CONTACT_*`, `TURNSTILE_SECRET_KEY` are
  real credentials — reuse the staging values or provision production-specific
  ones, your call.
- Secrets take effect on the live worker immediately; no redeploy is required for
  them. (A subsequent deploy keeps them.)

### 3. Turnstile domain allow-list

`TURNSTILE_SITE_KEY` in `[env.production.vars]` is currently the same widget as
staging. For the contact form to validate on `napochaan.com`, add `napochaan.com`
to that Turnstile widget's allowed domains in the Cloudflare dashboard — or
create a production-specific widget and update `TURNSTILE_SITE_KEY` +
`TURNSTILE_SECRET_KEY`. Otherwise Turnstile errors with `110200`.

### 4. Cloudflare Access for the cms host

`cms.napochaan.com` needs a host-wide Access app (Managed OAuth ON) plus a path-level
Bypass app for `/api/media-upload`, then `CF_ACCESS_AUD` / `CF_ACCESS_MCP_AUD` in
`apps/cms/wrangler.jsonc` `env.production.vars`. Until the AUD is set the Access plugin
has no AUD and `/mcp` answers 500. See `docs/cloudflare-access.md`. web (`napochaan.com`)
has **no** Access app.

## Verify

```bash
curl -sI https://napochaan.com | head -1            # 200
curl -sI https://cms.napochaan.com | head -1        # 401 / 302 (Access)
```

Then open `https://cms.napochaan.com/admin` and complete the first-user onboarding (or
Access auto-login) to create the production admin account. Publish a post and confirm
`https://napochaan.com/` reflects it (cms `afterChange` → `env.WEB.purge()`).
