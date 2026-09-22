// Adobe Fonts (Typekit) async loader + boot-overlay gate. Built on the standard
// Adobe async embed (kit loads non-blocking; Web Font Loader toggles the
// wf-loading → wf-active / wf-inactive classes on <html>), with one addition: a
// `boot` class that drives the LoadingOverlay.
//
// `boot` is rendered into the SSR <html> class (see layout.tsx), NOT added by this
// script — so the overlay covers from the very first paint with no JS-timing gap. A
// cached load that paints before this script runs would otherwise flash the bare,
// unfonted content (the original bug). This script only REMOVES boot: for humans once
// fonts have RESOLVED *and* a minimum on-screen time has elapsed — i.e.
// max(font-load-time, BOOT_MIN_MS) — and for bots immediately (before paint). A
// pageshow(persisted) handler also lifts it on bfcache restore, where the page is
// frozen with fonts already applied so re-running the boot would be wrong.
//
// The minimum-display clock (`t0`) is anchored to FIRST PAINT, not to script
// execution: a requestAnimationFrame callback re-assigns t0 at the first
// rendering opportunity (≈ first paint, when the overlay actually becomes
// visible). Measuring from parse time looked fine on desktop, but on mobile the
// render-blocking CSS download pushes first paint hundreds of ms after this
// script runs, so the BOOT_MIN_MS budget was mostly spent before anything was on
// screen and the overlay barely flashed. Because cached fonts can resolve BEFORE
// that rAF fires (re-anchoring t0 after the wait was scheduled), the boot
// removal is a self-re-checking callback that keeps deferring until the floor —
// measured from the latest t0 — has truly elapsed. A MutationObserver
// watches for wf-active / wf-inactive (set by Web Font Loader on success/failure,
// or by our own scriptTimeout fallback) so the overlay component itself stays a
// pure-CSS Server Component (it only reads `html.boot`) — all timing logic lives
// here in the bootstrap script, never in React.
//
// Injected via dangerouslySetInnerHTML in the layout <head>; kept as a string
// because it is vendor-shaped code (var / IIFE / reassignment / Date.now) and
// must not be linted or reformatted as project source. Defined once here and
// shared by every document root that loads the kit (site layout + global-error
// fallback) so the two cannot drift.
//
// To tune the floor, change the BOOT_MIN_MS literal (1000) below — the minimum the
// boot sequence lingers on screen. It is purely aesthetic pacing: the SSR boot class
// already prevents any bare-content flash, so the floor only decides how long the
// human boot shows. The BootQuestion typewriter only starts after hydration, so at a
// short floor the prompt reads as a quick glitch-flash rather than a full sentence —
// a deliberate trade. Bots skip the overlay, so this never affects audit first paint.
//
// Returning visitors skip the aesthetic floor entirely: every successful human boot
// stamps `localStorage[BOOT_SEEN_KEY]` with the current time, and a load within
// BOOT_SEEN_TTL_MS (7 days) of that stamp runs with a 0 ms floor — boot drops the
// moment Web Font Loader reports wf-active/wf-inactive, which by then resolves in
// tens of ms because the kit is served from HTTP cache. The overlay still covers
// first paint (it is SSR'd, see above), so this never reintroduces FOUT — it only
// shortens how long an already-cached, already-fonted repeat load keeps showing the
// overlay. Storage access is wrapped in try/catch: private mode or disabled storage
// silently falls back to the normal 1 s floor instead of throwing.
//
// Bots (crawlers, Lighthouse, PageSpeed, headless) get boot REMOVED synchronously
// here, before first paint. boot is SSR'd for everyone (UA-independent, to keep the
// markup ISR/statically cacheable — a per-UA server branch would force dynamic
// rendering), so the bot exemption has to happen client-side, but synchronously in
// <head> it still lands before paint: an auditor/crawler never sees the overlay and
// measures the real content's first paint. The branded boot is for humans only.
export const BOOT_SEEN_KEY = 'napochaan:boot-seen';
export const BOOT_SEEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const script = `(function(d) {
  var config = { kitId: 'vmz7pfu', scriptTimeout: 3000, async: true },
      h = d.documentElement,
      SEEN_KEY = '${BOOT_SEEN_KEY}',
      SEEN_TTL = ${BOOT_SEEN_TTL_MS},
      seen = false,
      BOOT_MIN_MS = 1000,
      BOT = /bot|crawl|spider|lighthouse|headlesschrome|pagespeed|gtmetrix|slurp/i.test(navigator.userAgent),
      t0 = Date.now(),
      t = setTimeout(function () { h.className = h.className.replace(/\\bwf-loading\\b/g, "") + " wf-inactive"; }, config.scriptTimeout),
      tk = d.createElement("script"), f = false, s = d.getElementsByTagName("script")[0], a;
  try { seen = Date.now() - parseInt(localStorage.getItem(SEEN_KEY) || '0', 10) < SEEN_TTL; } catch (e) {}
  if (seen) BOOT_MIN_MS = 0;
  if (BOT) h.className = h.className.replace(/\\bboot\\b/g, "");
  requestAnimationFrame(function () { t0 = Date.now(); });
  var obs = new MutationObserver(function () {
    var c = h.className;
    if (c.indexOf("wf-active") > -1 || c.indexOf("wf-inactive") > -1) {
      obs.disconnect();
      var done = function () {
        var left = BOOT_MIN_MS - (Date.now() - t0);
        if (left > 0) { setTimeout(done, left); return; }
        h.className = h.className.replace(/\\bboot\\b/g, "");
        if (!BOT) { try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch (e) {} }
      };
      setTimeout(done, Math.max(0, BOOT_MIN_MS - (Date.now() - t0)));
    }
  });
  obs.observe(h, { attributes: true, attributeFilter: ["class"] });
  addEventListener("pageshow", function (e) { if (e.persisted) h.className = h.className.replace(/\\bboot\\b/g, ""); });
  tk.src = 'https://use.typekit.net/' + config.kitId + '.js';
  tk.async = true;
  tk.onload = tk.onreadystatechange = function () {
    a = this.readyState;
    if (f || a && a != "complete" && a != "loaded") return;
    f = true; clearTimeout(t);
    try { Typekit.load(config) } catch (e) {}
  };
  s.parentNode.insertBefore(tk, s);
})(document);`;

// Ready-to-spread payload for <script dangerouslySetInnerHTML={...}>. Frozen at
// module scope so the prop is a stable reference (no per-render object literal).
export const typekitLoaderHtml = { __html: script };
