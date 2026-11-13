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
  the prod R2 bucket. No admin user is seeded. The cms runs behind host-wide
  Cloudflare Access from its first deploy (step 1–3 below), so the admin user is
  created by Access auto-login on the first visit to the admin (served at the host root `/`) — Payload's first-user
  onboarding screen is never exposed publicly.

`napochaan-cache-production` (D1 / R2) was the OpenNext incremental / tag cache of the
old ISR setup. web is now SSR + Workers Cache and no longer binds them; they can be
deleted once nothing references them.

## Remaining steps

**Order matters.** Do the first production cutover **by hand, in this order**. Do not
use the root `pnpm deploy:production` or the `Deploy` workflow for it: both deploy cms
and web back to back, with no pause to set the cms secrets.

- **cms without `CF_ACCESS_AUD`.** The Access plugin is disabled, so `cms.napochaan.com`
  is a public Payload password login.
- **cms without `PAYLOAD_SECRET`.** Every request throws. A web build that reads the
  cms then 500s on every page.

Until step 6, the currently deployed web keeps serving `napochaan.com` on its own
Payload, which reads the same D1/R2.

### 1. Create the Cloudflare Access apps for the cms host

On `cms.napochaan.com`, create:

- a **host-wide** self-hosted app (Managed OAuth ON, policy: the owner only);
- a **path-level Bypass** app for `cms.napochaan.com/api/media-upload` (MCP
  `create_upload_url` uploads; the route authorizes by HMAC signature only).

See `docs/cloudflare-access.md`. web (`napochaan.com`) has **no** Access app.

### 2. Commit the AUDs

In `apps/cms/wrangler.jsonc` `env.production.vars`, set:

- `CF_ACCESS_AUD`: the host-wide app's AUD;
- `CF_ACCESS_MCP_AUD`: the same value (MCP sits behind the same host-wide app).

Commit them, then check them:

```bash
pnpm --filter cms deploy:access:check:production   # must print "Cloudflare Access AUDs are set."
```

The `Deploy` workflow's production job runs the same guard before any deploy step,
so a `workflow_dispatch` cannot ship an Access-less cms.

### 3. Deploy the cms alone

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
pnpm --filter cms deploy:database:check:production
pnpm --filter cms deploy:database:production   # schema is already migrated; this is a no-op unless new migrations exist
pnpm --filter cms deploy:production            # cms ONLY — not the root script
```

**Circular binding.** cms binds `WEB` and web binds `CMS`. The cms `WEB` binding targets
`napochaan-website-production`. That Worker already exists (the pre-split site), so the
cms deploys in the steady order.

- On a brand-new account, the order is cms (without `WEB`) → web → cms (with `WEB`).
- Deleting a Worker that is still referenced needs `--delete-with-references`.

### 4. Set the cms secrets, then confirm the cms

Each Worker has its own secrets. Run the `wrangler` commands from the matching app
directory.

```bash
cd apps/cms
wrangler secret put PAYLOAD_SECRET --env production   # openssl rand -hex 32 — NEW value, distinct from staging
wrangler secret put PREVIEW_SECRET --env production   # openssl rand -hex 32 — MUST equal web's (step 5)
```

Secrets take effect on the live Worker immediately; no redeploy is needed, and later
deploys keep them.

**Does `wrangler secret put` need the Worker to exist?** No. When the Worker does not
exist yet, wrangler offers to create it, and the default is yes (also in CI and other
non-interactive runs). It then uploads a placeholder Worker (`export default { fetch() {} }`,
no routes) and puts the secret on it.

- **Source:** `wrangler` 4.151.3, `wrangler-dist/cli.js`, `createDraftWorker` (≈ line 311309).
  - Prompt: "There doesn't seem to be a Worker called … Do you want to create a new Worker
    with that name and add secrets to it?"
  - Options: `{ defaultValue: true, fallbackValue: true }`.
  - The `secret put` handler calls it on `isWorkerNotFoundError`.
- **Docs:** the Cloudflare docs page for `wrangler secret put` does not mention this.

So the order above is not forced by wrangler. It is chosen so that Access is in front of
the cms before anything else.

Confirm the cms before touching web:

```bash
curl -sI https://cms.napochaan.com/ | head -1                             # 302 (Access login) — never a Payload login page
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cms.napochaan.com/api/media-upload   # 4xx from the route itself (Bypass), not an Access 302
```

Then, in a browser:

- Open `https://cms.napochaan.com/` (the admin is at the host root). Access logs you in, and the admin user is created automatically.
- `curl -sI` with your Access JWT shows `content-security-policy: … frame-ancestors 'self'` and
  `x-frame-options: SAMEORIGIN`.

### 5. Set the web secrets

```bash
cd apps/web
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
- `PREVIEW_SECRET` is shared: cms signs the Live Preview URL, web verifies it. A
  mismatch fails silently, as a 403 inside the Live Preview iframe.
- `RESEND_API_KEY`, `DISCORD_WEBHOOK_URL`, `CONTACT_*`, `TURNSTILE_SECRET_KEY` are
  real credentials — reuse the staging values or provision production-specific
  ones, your call.

### 6. Deploy web

```bash
pnpm --filter web deploy:production   # CLOUDFLARE_ENV=production astro build → wrangler deploy → Workers Cache warm-up (apps/web/scripts/warm-cache.mjs)
```

From here on, the root `pnpm deploy:production` (cms → web) and the `Deploy` workflow's
production job are safe to use.

### 7. Turnstile domain allow-list

`TURNSTILE_SITE_KEY` in `[env.production.vars]` is currently the same widget as
staging. For the contact form to validate on `napochaan.com`, add `napochaan.com`
to that Turnstile widget's allowed domains in the Cloudflare dashboard — or
create a production-specific widget and update `TURNSTILE_SITE_KEY` +
`TURNSTILE_SECRET_KEY`. Otherwise Turnstile errors with `110200`.

## Verify

```bash
curl -sI https://napochaan.com | head -1            # 200
curl -sI https://cms.napochaan.com | head -1        # 401 / 302 (Access)
```

Then open `https://cms.napochaan.com/` (admin root). Access auto-login signs you in and creates
the admin user on the first visit. Publish a post and confirm `https://napochaan.com/`
reflects it (cms `afterChange` → `env.WEB.purge()`).

Then log out from the admin nav and check two things:

- The browser passes through `https://napochaan.com/next/exit-preview?redirect=…`
  before it reaches the Access logout.
- No `__prerender_bypass` cookie remains on `napochaan.com`.
