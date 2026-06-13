# Production deploy runbook

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
- **wrangler.toml**: real D1 ids wired into `[env.production]`, and the
  `napochaan.com` `custom_domain` route added (a worker with no route is
  unreachable).
- **package.json**: `deploy:production` and `deploy:database:production` scripts
  added (mirror the staging scripts).
- **Schema migrated**: all 8 migrations applied to `napochaan-cms-production`.
- **Content seeded**: `seed:import:prod` loaded 10 news / 42 works / 2 blog /
  32 logs / 12 gallery + the profile global into prod D1, with media uploaded to
  the prod R2 bucket. No admin user is seeded — the production admin is created
  via Payload's first-user onboarding screen after the first deploy.

The OpenNext tag-cache table (`revalidations` in `napochaan-cache-production`) is
**not** created here — `opennextjs-cloudflare deploy` runs
`CREATE TABLE IF NOT EXISTS` for it, so the first deploy provisions it.

## Remaining steps

### 1. First deploy (creates the worker)

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
pnpm deploy:production
```

This builds with OpenNext, deploys `napochaan-website-production`, binds it to
`napochaan.com`, creates the cache-D1 schema, and busts the ISR cache at the end.

Schema is already migrated, but to re-apply migrations later (after new
`payload:migrate:create`) run:

```bash
CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm deploy:database:production
```

### 2. Set the production secrets

Secrets attach to a worker, so they can only be set **after** step 1 exists.
Production needs the same 8 secrets staging uses. Set each with:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72

wrangler secret put PAYLOAD_SECRET       --env production   # openssl rand -hex 32 — use a NEW value, distinct from staging
wrangler secret put PREVIEW_SECRET       --env production   # openssl rand -hex 32 — live-preview signing
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

## Verify

```bash
curl -sI https://napochaan.com | head -1            # 200
```

Then open `https://napochaan.com/admin` and complete the first-user onboarding to
create the production admin account.
