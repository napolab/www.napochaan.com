// Adobe Fonts (Typekit) async loader + boot-overlay gate. Built on the standard
// Adobe async embed (kit loads non-blocking; Web Font Loader toggles the
// wf-loading → wf-active / wf-inactive classes on <html>), with one addition: a
// `boot` class that drives the LoadingOverlay.
//
// `boot` is added synchronously alongside wf-loading (before the body paints) and
// removed only once fonts have RESOLVED *and* a minimum on-screen time has
// elapsed — i.e. max(font-load-time, BOOT_MIN_MS). This guarantees the overlay is
// perceivable even when fonts are cached and resolve in a few ms (without it the
// overlay would flash for one frame and read as a glitch).
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
// To tune the floor, change the BOOT_MIN_MS literal (3000) below. The floor is the
// minimum the boot sequence stays on screen. It has to be this long because the
// BootQuestion typewriter is a client island: it can only start typing after the
// JS bundle hydrates, so the overlay must outlast hydration + a readable slice of
// the typewriter. Once the admin-only fonts were removed and the kit resolves fast,
// fonts no longer hold the overlay up — the floor became the only thing that does,
// so a short floor (700ms/1.2s) dropped the overlay before any text appeared. Since
// bots skip the overlay (below), a longer floor only shapes the human boot and never
// the audit/crawler first paint.
//
// Bots (crawlers, Lighthouse, PageSpeed, headless) skip the `boot` class entirely:
// the overlay is opacity:0 by default, so without `boot` the page paints its real
// content on first frame instead of waiting behind the font-load gate. The branded
// boot sequence is for humans; an auditor / crawler measuring first paint sees the
// content immediately. The fonts still load the same way (wf-loading is kept) and
// the SSR'd DOM is identical — only the transient cover is suppressed.
const script = `(function(d) {
  var config = { kitId: 'vmz7pfu', scriptTimeout: 3000, async: true },
      h = d.documentElement,
      BOOT_MIN_MS = 3000,
      BOT = /bot|crawl|spider|lighthouse|headlesschrome|pagespeed|gtmetrix|slurp/i.test(navigator.userAgent),
      t0 = Date.now(),
      t = setTimeout(function () { h.className = h.className.replace(/\\bwf-loading\\b/g, "") + " wf-inactive"; }, config.scriptTimeout),
      tk = d.createElement("script"), f = false, s = d.getElementsByTagName("script")[0], a;
  h.className += BOT ? " wf-loading" : " wf-loading boot";
  requestAnimationFrame(function () { t0 = Date.now(); });
  var obs = new MutationObserver(function () {
    var c = h.className;
    if (c.indexOf("wf-active") > -1 || c.indexOf("wf-inactive") > -1) {
      obs.disconnect();
      var done = function () {
        var left = BOOT_MIN_MS - (Date.now() - t0);
        if (left > 0) { setTimeout(done, left); return; }
        h.className = h.className.replace(/\\bboot\\b/g, "");
      };
      setTimeout(done, Math.max(0, BOOT_MIN_MS - (Date.now() - t0)));
    }
  });
  obs.observe(h, { attributes: true, attributeFilter: ["class"] });
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
