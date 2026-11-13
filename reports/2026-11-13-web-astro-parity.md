# web-astro parity check against the Next app (Task 10)

Date: 2026-11-13. Branch `feat/web-astro`.

## Mode

**Local, both apps against the same cms data.**

- **A (reference)** is `apps/web`. It was built with `opennextjs-cloudflare build` (default env, not `CLOUDFLARE_ENV=staging`, so the `CMS` binding is `napochaan-cms`) and served with `opennextjs-cloudflare preview --port 8792`.
- **B (candidate)** is `apps/web-astro`. It was built with `astro build` and served with `wrangler dev --port 8791`.
- **cms:** both bind the `CMS` service (`napochaan-cms#CMS`) through the wrangler dev registry. Both showed `[connected]` to one stub worker (port 8790).
  - The stub is a `WorkerEntrypoint` `CMS` that wraps `createApp(services)` from `@napochaan/cms-api`.
  - Its fixtures:
    - 13 posts: dotted slug `a.b`, rich Lexical bodies with h2/h3, a code block, a list and a link, seo overrides, thumbnails;
    - 14 news: dotted slug, one external item;
    - 53 works;
    - 8 gallery photos;
    - 2 logs, one of them upcoming;
    - the sample profile.
  - `media.file` serves a real JPEG.
  - It lived in the session scratchpad and is not committed. It uses the same approach as the earlier task stubs.
  - The real `apps/cms` was not used: it has no local D1 state, and seeding Payload locally is far heavier than the stub.
- Both sides use `BASE_URL=http://localhost:3000`, so canonical and og URLs compare as-is.

## Tooling

- `scripts/parity-check.mjs <baseA> <baseB> [--json]`
  - Runs read-only GETs with `redirect: manual`.
  - Discovers slugs from A's `sitemap.xml`: the dotted slug plus 2 plain slugs per collection.
  - Exits 1 on any field mismatch the whitelist does not cover, and also when **A** answers a probe with an unexpected status. That guards against both sides being broken the same way.
- `scripts/parity-urls.mjs` holds the probe list with expected statuses:
  - every route family;
  - pagination, including `page/1` (308), `page/abc|01|0` (404) and past-the-end `page/3`;
  - `.md` twins and Next's internal `/<section>/<slug>/md`;
  - RSS ×5, `llms.txt`, `llms-full.txt`, `sitemap.xml`, `robots.txt`, `security.txt`;
  - the default OG image, the hashed Next OG/icon URLs and the un-hashed `/icon.png`;
  - per-slug OG routes;
  - `/logs` and `/logs?query`;
  - 5 preview pages without a cookie (404);
  - the preview handshake with a wrong secret (403);
  - a media 404;
  - 404 probes.
- `scripts/parity/compare.mjs` holds the pure helpers. `scripts/parity/whitelist.mjs` holds the accepted differences as data.
  - Each entry is keyed by path pattern, field and **both** values.
  - Unused entries are printed.
- Tests: `src/scripts/parity-compare.test.ts` and `src/scripts/parity-urls.test.ts`. The latter includes a cross-module check that the OG suffixes equal the route filenames.

### Compared fields
- **Every probe:** status, `content-type`, Cache-Control class, and `Location` for 3xx.
- **HTML:** `<title>`, `description`, `robots`, `canonical`, `alternate` links, `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `twitter:card`, `twitter:image` and the first `h1`.
- **Text bodies** (markdown, RSS, XML, text/plain): the normalized full body.
- **PNG:** IHDR dimensions.

### Normalizations (in code, documented here)
- **Cache-Control by class.** A value containing `no-store` or `private` is `uncacheable`. Next sends `private, no-cache, no-store, max-age=0, must-revalidate`; Astro sends `no-store`. Cacheable values compare their sorted directives exactly.
- **og:image / twitter:image** drop the query string (Next's `?hash` cache-buster, per the og/twitter image ruling).
- **content-type** is compared lowercased with normalized `;` spacing. A missing charset still differs.
- **Text bodies:** CRLF becomes LF, trailing whitespace is trimmed, and RSS `<lastBuildDate>` and security.txt `Expires` are masked.

## Mismatches

| Run | Probes | Failing probes | Mismatched fields |
| --- | --- | --- | --- |
| Baseline (empty whitelist, initial 84 probes) | 84 | 25 | 145 |
| After the whitelist (88 probes: hashed OG/icon URLs added) | 88 | 4 | 4 |
| After the fix | 88 | **0** | **0** (exit 0) |

Of the 25 baseline failures:
- 21 were ruled or explained deviations, now whitelisted (see below).
- 2 were wrong expectations in the probe list:
  - `/icon.png` does not exist on Next;
  - the preview handshake checks the secret before the path, so a bad path with a bad secret answers 403.

Adding the hashed Next URLs then surfaced **4 real mismatches**, which are fixed.

### Fixed
| Mismatch | Fix | Regression test |
| --- | --- | --- |
| `/opengraph-image-12o0cb.png`, `/twitter-image-12o0cb.png`, `/icon-12o0cb.png`, `/apple-icon-12o0cb.png` | Cache-Control was `public, max-age=0, must-revalidate` (the static-asset default). Next served these file-convention routes with the cms policy `public, max-age=0, s-maxage=31536000`. Added `public/_headers` rules. | `src/utils/cache-control/public-headers.test.ts` asserts each rule equals `PAGE_CACHE_POLICIES.cms` |

### Whitelist (accepted, with reasons)
| id | Path / field | A → B | Reason |
| --- | --- | --- | --- |
| `default-og-image-url` | any / og:image | `/opengraph-image-12o0cb.png` → `/og-default.png` | Ruling: og/twitter image URL change. The bytes are identical (md5 83c89b0f…), and the hashed URL still serves 200 on B |
| `default-twitter-image-url` | any / twitter:image | `/twitter-image-12o0cb.png` → `/og-default.png` | Same ruling. Next's twitter-image and og-default are byte-identical |
| `missing-slug-og-image` | `/blog\|news/<missing>` / og:image | segment OG route → `/og-default.png` | Next keeps the segment OG convention on a 404 page that is noindex |
| `not-found-robots-local` | any / robots | `noindex` → `noindex, nofollow` | Local-host only. Next injects `noindex` ahead of the metadata value; on production both emit `noindex` (live Next 404; `build-metadata.ts`) |
| `not-found-h1-ssr` | any / h1 | ∅ → `404` | Next (locally and on live) renders the not-found body client-side; Astro SSRs it. An improvement |
| `past-the-end-page-404` | `/{blog,news,works}/page/3` / all | 200 → 404 | Ruling: past-the-end pages are real 404s |
| `internal-md-rewrite-404` | `/{section}/<slug>/md` / all | 200 → 404 | Ruling: internal rewrite targets are not public |
| `unhashed-icon-url` | `/icon.png` / all | 404 → 200 | Ruling: icon URL change. The hashed `/icon-12o0cb.png` matches |
| `logs-redirect-cache-control` | `/logs[?…]` / cache-control | none → uncacheable | Ruling: `/logs` as an endpoint. Next config redirects bypassed the worker |
| `robots-txt-charset-local` | `/robots.txt` / content-type | `text/plain` → `text/plain; charset=utf-8` | OpenNext local preview artifact. Live napochaan.com answers `text/plain; charset=utf-8`, which B matches |

### Final parity output
| result | path | A status | B status | notes |
| --- | --- | --- | --- | --- |
| OK | `/` | 200 | 200 |  |
| OK | `/about` | 200 | 200 |  |
| OK* | `/colophon` | 200 | 200 | og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url) |
| OK | `/contact` | 200 | 200 |  |
| OK* | `/gallery` | 200 | 200 | og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url) |
| OK | `/log` | 200 | 200 |  |
| OK | `/blog` | 200 | 200 |  |
| OK | `/news` | 200 | 200 |  |
| OK | `/works` | 200 | 200 |  |
| OK | `/blog/page/2` | 200 | 200 |  |
| OK | `/news/page/2` | 200 | 200 |  |
| OK | `/works/page/2` | 200 | 200 |  |
| OK | `/blog/page/1` | 308 | 308 |  |
| OK | `/news/page/1` | 308 | 308 |  |
| OK | `/works/page/1` | 308 | 308 |  |
| OK* | `/blog/page/abc` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/news/page/01` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/works/page/0` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/blog/page/3` | 200 | 404 | status (whitelisted: past-the-end-page-404); cache-control (whitelisted: past-the-end-page-404); title (whitelisted: past-the-end-page-404); description (whitelisted: past-the-end-page-404); canonical (whitelisted: past-the-end-page-404); alternates (whitelisted: past-the-end-page-404); og:title (whitelisted: past-the-end-page-404); og:description (whitelisted: past-the-end-page-404); og:url (whitelisted: past-the-end-page-404); h1 (whitelisted: past-the-end-page-404) |
| OK* | `/news/page/3` | 200 | 404 | status (whitelisted: past-the-end-page-404); cache-control (whitelisted: past-the-end-page-404); title (whitelisted: past-the-end-page-404); description (whitelisted: past-the-end-page-404); canonical (whitelisted: past-the-end-page-404); alternates (whitelisted: past-the-end-page-404); og:title (whitelisted: past-the-end-page-404); og:description (whitelisted: past-the-end-page-404); og:url (whitelisted: past-the-end-page-404); h1 (whitelisted: past-the-end-page-404) |
| OK* | `/works/page/3` | 200 | 404 | status (whitelisted: past-the-end-page-404); cache-control (whitelisted: past-the-end-page-404); title (whitelisted: past-the-end-page-404); description (whitelisted: past-the-end-page-404); canonical (whitelisted: past-the-end-page-404); alternates (whitelisted: past-the-end-page-404); og:title (whitelisted: past-the-end-page-404); og:description (whitelisted: past-the-end-page-404); og:url (whitelisted: past-the-end-page-404); h1 (whitelisted: past-the-end-page-404) |
| OK | `/about.md` | 200 | 200 |  |
| OK | `/blog.md` | 200 | 200 |  |
| OK | `/news.md` | 200 | 200 |  |
| OK | `/works.md` | 200 | 200 |  |
| OK | `/log.md` | 200 | 200 |  |
| OK | `/blog/rss.xml` | 200 | 200 |  |
| OK | `/news/rss.xml` | 200 | 200 |  |
| OK | `/works/rss.xml` | 200 | 200 |  |
| OK | `/log/rss.xml` | 200 | 200 |  |
| OK | `/gallery/rss.xml` | 200 | 200 |  |
| OK | `/llms.txt` | 200 | 200 |  |
| OK | `/llms-full.txt` | 200 | 200 |  |
| OK | `/sitemap.xml` | 200 | 200 |  |
| OK* | `/robots.txt` | 200 | 200 | content-type (whitelisted: robots-txt-charset-local) |
| OK | `/.well-known/security.txt` | 200 | 200 |  |
| OK | `/og-default.png` | 200 | 200 |  |
| OK | `/opengraph-image-12o0cb.png` | 200 | 200 |  |
| OK | `/twitter-image-12o0cb.png` | 200 | 200 |  |
| OK | `/icon-12o0cb.png` | 200 | 200 |  |
| OK | `/apple-icon-12o0cb.png` | 200 | 200 |  |
| OK* | `/icon.png` | 404 | 200 | status (whitelisted: unhashed-icon-url); content-type (whitelisted: unhashed-icon-url); cache-control (whitelisted: unhashed-icon-url); title (whitelisted: unhashed-icon-url); description (whitelisted: unhashed-icon-url); robots (whitelisted: unhashed-icon-url); canonical (whitelisted: unhashed-icon-url); alternates (whitelisted: unhashed-icon-url); og:title (whitelisted: unhashed-icon-url); og:description (whitelisted: unhashed-icon-url); og:url (whitelisted: unhashed-icon-url); og:type (whitelisted: unhashed-icon-url); og:image (whitelisted: unhashed-icon-url); twitter:card (whitelisted: unhashed-icon-url); twitter:image (whitelisted: unhashed-icon-url); png (whitelisted: unhashed-icon-url) |
| OK* | `/logs` | 308 | 308 | cache-control (whitelisted: logs-redirect-cache-control) |
| OK* | `/logs?from=parity` | 308 | 308 | cache-control (whitelisted: logs-redirect-cache-control) |
| OK* | `/blog/preview/1` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/news/preview/n0` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/works/preview/w0` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/gallery/preview` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/log/preview` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK | `/next/preview?path=/blog/preview/1&previewSecret=wrong` | 403 | 403 |  |
| OK | `/next/preview?path=//evil.example&previewSecret=wrong` | 403 | 403 |  |
| OK | `/api/media/file/does-not-exist.jpg` | 404 | 404 |  |
| OK* | `/does-not-exist` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/blog/does-not-exist` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: missing-slug-og-image); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK | `/blog/does-not-exist.md` | 404 | 404 |  |
| OK* | `/news/does-not-exist` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: missing-slug-og-image); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK | `/works/does-not-exist.md` | 404 | 404 |  |
| OK* | `/deep/nested/missing/path` | 404 | 404 | robots (whitelisted: not-found-robots-local); og:image (whitelisted: default-og-image-url); twitter:image (whitelisted: default-twitter-image-url); h1 (whitelisted: not-found-h1-ssr) |
| OK | `/blog/a.b` | 200 | 200 |  |
| OK | `/blog/a.b.md` | 200 | 200 |  |
| OK | `/blog/a.b/opengraph-image-fx5gi7` | 200 | 200 |  |
| OK | `/blog/cannelloni-vj-tools` | 200 | 200 |  |
| OK | `/blog/cannelloni-vj-tools.md` | 200 | 200 |  |
| OK | `/blog/cannelloni-vj-tools/opengraph-image-fx5gi7` | 200 | 200 |  |
| OK | `/blog/post-1` | 200 | 200 |  |
| OK | `/blog/post-1.md` | 200 | 200 |  |
| OK | `/blog/post-1/opengraph-image-fx5gi7` | 200 | 200 |  |
| OK | `/news/a.b` | 200 | 200 |  |
| OK | `/news/a.b.md` | 200 | 200 |  |
| OK | `/news/a.b/opengraph-image-5nvrt4` | 200 | 200 |  |
| OK | `/news/news-2` | 200 | 200 |  |
| OK | `/news/news-2.md` | 200 | 200 |  |
| OK | `/news/news-2/opengraph-image-5nvrt4` | 200 | 200 |  |
| OK | `/news/news-3` | 200 | 200 |  |
| OK | `/news/news-3.md` | 200 | 200 |  |
| OK | `/news/news-3/opengraph-image-5nvrt4` | 200 | 200 |  |
| OK | `/works/a.b` | 200 | 200 |  |
| OK | `/works/a.b.md` | 200 | 200 |  |
| OK | `/works/a.b/opengraph-image-apsyht` | 200 | 200 |  |
| OK | `/works/work-1` | 200 | 200 |  |
| OK | `/works/work-1.md` | 200 | 200 |  |
| OK | `/works/work-1/opengraph-image-apsyht` | 200 | 200 |  |
| OK | `/works/work-2` | 200 | 200 |  |
| OK | `/works/work-2.md` | 200 | 200 |  |
| OK | `/works/work-2/opengraph-image-apsyht` | 200 | 200 |  |
| OK* | `/blog/a.b/md` | 200 | 404 | status (whitelisted: internal-md-rewrite-404); content-type (whitelisted: internal-md-rewrite-404); cache-control (whitelisted: internal-md-rewrite-404); body (whitelisted: internal-md-rewrite-404); title (whitelisted: internal-md-rewrite-404); description (whitelisted: internal-md-rewrite-404); robots (whitelisted: internal-md-rewrite-404); canonical (whitelisted: internal-md-rewrite-404); alternates (whitelisted: internal-md-rewrite-404); og:title (whitelisted: internal-md-rewrite-404); og:description (whitelisted: internal-md-rewrite-404); og:url (whitelisted: internal-md-rewrite-404); og:type (whitelisted: internal-md-rewrite-404); og:image (whitelisted: internal-md-rewrite-404); twitter:card (whitelisted: internal-md-rewrite-404); twitter:image (whitelisted: internal-md-rewrite-404); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/news/a.b/md` | 200 | 404 | status (whitelisted: internal-md-rewrite-404); content-type (whitelisted: internal-md-rewrite-404); cache-control (whitelisted: internal-md-rewrite-404); body (whitelisted: internal-md-rewrite-404); title (whitelisted: internal-md-rewrite-404); description (whitelisted: internal-md-rewrite-404); robots (whitelisted: internal-md-rewrite-404); canonical (whitelisted: internal-md-rewrite-404); alternates (whitelisted: internal-md-rewrite-404); og:title (whitelisted: internal-md-rewrite-404); og:description (whitelisted: internal-md-rewrite-404); og:url (whitelisted: internal-md-rewrite-404); og:type (whitelisted: internal-md-rewrite-404); og:image (whitelisted: internal-md-rewrite-404); twitter:card (whitelisted: internal-md-rewrite-404); twitter:image (whitelisted: internal-md-rewrite-404); h1 (whitelisted: not-found-h1-ssr) |
| OK* | `/works/a.b/md` | 200 | 404 | status (whitelisted: internal-md-rewrite-404); content-type (whitelisted: internal-md-rewrite-404); cache-control (whitelisted: internal-md-rewrite-404); body (whitelisted: internal-md-rewrite-404); title (whitelisted: internal-md-rewrite-404); description (whitelisted: internal-md-rewrite-404); robots (whitelisted: internal-md-rewrite-404); canonical (whitelisted: internal-md-rewrite-404); alternates (whitelisted: internal-md-rewrite-404); og:title (whitelisted: internal-md-rewrite-404); og:description (whitelisted: internal-md-rewrite-404); og:url (whitelisted: internal-md-rewrite-404); og:type (whitelisted: internal-md-rewrite-404); og:image (whitelisted: internal-md-rewrite-404); twitter:card (whitelisted: internal-md-rewrite-404); twitter:image (whitelisted: internal-md-rewrite-404); h1 (whitelisted: not-found-h1-ssr) |

    whitelist entries unused: none
    probes: 88, failing: 0, mismatched fields: 0

(Slugs discovered: `{"blog":["a.b","cannelloni-vj-tools","post-1"],"news":["a.b","news-2","news-3"],"works":["a.b","work-1","work-2"]}`. Rows marked `OK*` are whitelisted.)

## Lighthouse

The chrome-devtools MCP `lighthouse_audit` and `emulate` tools failed on this browser with a protocol error (`Network.emulateNetworkConditionsByRule … params.offline missing`). The numbers below therefore come from the **Lighthouse 12.8.2 CLI**, run against Playwright's Chromium 1254 (headless).

- **Setup:** mobile preset, simulated throttling, 3 cold runs per URL, built workers (not dev servers), the same stub data.
- **A** is the Next app on :8792; **B** is the Astro app on :8791.
- Values are the **median of 3 runs**.

| Page | App | Perf | A11y | FCP ms | LCP ms | TBT ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Next | 34 | 100 | 6206 | 9495 | 558 | 0.230 |
| `/` | Astro | 84 | 100 | 2123 | 2423 | 11 | 0.233 |
| `/blog/cannelloni-vj-tools` | Next | 63 | 100 | 3181 | 6102 | 366 | 0.000 |
| `/blog/cannelloni-vj-tools` | Astro | 85 | 100 | 2213 | 3185 | 16 | 0.136 |

**Accessibility** is equal: 100 on all four.

**Performance** is much better on Astro. TBT drops about 30×, and LCP falls by half or more.

**CLS: no regression.** The blog post's 0.000 vs 0.136 under simulated throttling is a timing artifact, not a font-metric regression.
- **Culprit.** Lighthouse names the `TypographyBand` marquee column (`div.pos_fixed > div.d_flex … will-change_transform`) together with the Typekit swap in the SysBar links and buttons. That is the same shift as on Next.
  - Both apps use the same Typekit kit (`wf-*` classes).
  - The `@fontsource` body fonts contribute only text nodes at about 0.0002.
- **Devtools throttling** (`--throttling-method=devtools`, 3 runs each) gives Next 0.136 / 0.136 / 0.136 and Astro 0.136 / 0.000 / 0.136.
- **Playwright** (412×823 mobile viewport, 4× CPU, PerformanceObserver): Next 0.0194, Astro 0.0193, with identical shift sources.
- **Desktop** (Chrome, PerformanceObserver): Next 0.035, Astro 0.016.
- **Why Next scored 0.000.** Under simulated throttling Next's first paint is later. The Typekit swap then lands before FCP, so it is not counted.
- **Home** is 0.23 on both, from the hero `-webkit-text-stroke` overlay span: a pre-existing shift, the same on both.

So the metric-adjusted fallback `@font-face` was **not** added.

## Not covered
- Full HTML body text is not diffed. Head metadata and h1 are, and earlier tasks diffed structure per route.
- Contact form submission is not exercised (Astro Actions vs a Next server action, different by design).
- Preview with a valid draft cookie is not exercised; Task 9 covered it.
