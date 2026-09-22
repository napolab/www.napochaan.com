// Pure helpers for scripts/warm-cache.mjs — no I/O here so they can run under
// vitest (see src/scripts/warm-cache-targets.test.ts) without a network or
// filesystem stub.

// Paths that are not in the sitemap but are served through Workers Cache.
export const EXTRA_PATHS = ['/blog/rss.xml', '/news/rss.xml', '/works/rss.xml', '/log/rss.xml', '/gallery/rss.xml', '/llms.txt', '/llms-full.txt'];

const XML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

const decodeXMLEntities = (value) => value.replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g, (entity) => XML_ENTITIES[entity]);

/** Extract every <loc> from a sitemap XML string, in document order, de-duplicated. */
export const parseSitemapLocations = (xml) => {
  const seen = new Set();
  const locations = [];
  for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const [, rawLocation] = match;
    if (rawLocation === undefined) continue;
    const location = decodeXMLEntities(rawLocation);
    if (seen.has(location)) continue;
    seen.add(location);
    locations.push(location);
  }
  return locations;
};

/**
 * Build the ordered, de-duplicated list of absolute URLs to warm: sitemap
 * locations first, then EXTRA_PATHS resolved against baseUrl. Only
 * same-origin URLs are kept.
 */
export const buildWarmTargets = (baseUrl, sitemapXml) => {
  const origin = new URL(baseUrl).origin;
  const seen = new Set();
  const targets = [];

  for (const location of parseSitemapLocations(sitemapXml)) {
    const url = new URL(location, baseUrl);
    if (url.origin !== origin) continue;
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    targets.push(url.href);
  }

  for (const path of EXTRA_PATHS) {
    const url = new URL(path, baseUrl);
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    targets.push(url.href);
  }

  return targets;
};
