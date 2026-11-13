// Pure helpers for scripts/parity-check.mjs: turn a fetched response into a comparable
// record, diff two records, and apply the whitelist. No I/O, so they run under vitest
// (src/scripts/parity-compare.test.ts).

const HTML_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&apos;': "'" };

const decodeEntities = (value) => value.replace(/&(?:amp|lt|gt|quot|apos|#x27|#39);/g, (entity) => HTML_ENTITIES[entity] ?? entity);

/** Attribute map of one start tag (`<meta a="b" c='d'>`), names lowercased. */
export const parseAttributes = (tag) => {
  const attributes = {};
  for (const match of tag.matchAll(/([^\s=/<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const [, name, double, single, bare] = match;
    if (name === undefined) continue;
    attributes[name.toLowerCase()] = decodeEntities(double ?? single ?? bare ?? '');
  }
  return attributes;
};

const startTags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => parseAttributes(tag));

const firstMeta = (metas, key, value) => metas.find((meta) => meta[key] === value)?.content;

const stripTags = (value) =>
  decodeEntities(value.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

// The first <title> outside inline <svg> (SVG <title> elements are accessible names).
const documentTitle = (html) => {
  const withoutSVG = html.replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(withoutSVG);
  if (match?.[1] === undefined) return undefined;
  return stripTags(match[1]);
};

const firstHeading = (html) => {
  const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (match?.[1] === undefined) return undefined;
  return stripTags(match[1]);
};

/**
 * Drop the query string from an image URL. Next appends a content `?hash` cache-buster
 * to file-convention OG / icon URLs; Astro does not (Ruling: og/twitter image URL change).
 */
export const stripQuery = (value) => {
  if (value === undefined) return undefined;
  const index = value.indexOf('?');
  return index === -1 ? value : value.slice(0, index);
};

/** The HTML fields compared between the two apps (first occurrence wins). */
export const extractHTMLFields = (html) => {
  const metas = startTags(html, 'meta');
  const links = startTags(html, 'link');
  return {
    title: documentTitle(html),
    description: firstMeta(metas, 'name', 'description'),
    robots: firstMeta(metas, 'name', 'robots'),
    canonical: links.find((link) => link.rel === 'canonical')?.href,
    alternates: links
      .filter((link) => link.rel === 'alternate')
      .map((link) => `${link.type ?? ''} ${link.href ?? ''}`)
      .toSorted()
      .join(' | '),
    'og:title': firstMeta(metas, 'property', 'og:title'),
    'og:description': firstMeta(metas, 'property', 'og:description'),
    'og:url': firstMeta(metas, 'property', 'og:url'),
    'og:type': firstMeta(metas, 'property', 'og:type'),
    'og:image': stripQuery(firstMeta(metas, 'property', 'og:image')),
    'twitter:card': firstMeta(metas, 'name', 'twitter:card'),
    'twitter:image': stripQuery(firstMeta(metas, 'name', 'twitter:image')),
    h1: firstHeading(html),
  };
};

/**
 * Cache-Control reduced to its caching class. Next stamps uncacheable responses
 * `private, no-cache, no-store, max-age=0, must-revalidate`, the Astro worker `no-store`;
 * both mean "never stored", so both classify as `uncacheable`. Cacheable values keep their
 * directives, sorted.
 */
export const classifyCacheControl = (value) => {
  if (value === null || value === undefined || value.trim() === '') return 'none';
  const directives = value
    .toLowerCase()
    .split(',')
    .map((directive) => directive.trim())
    .filter((directive) => directive !== '');
  if (directives.includes('no-store') || directives.includes('private')) return 'uncacheable';
  return directives.toSorted().join(', ');
};

/** `text/html; charset=utf-8` and `text/html;charset=UTF-8` compare equal. */
export const normalizeContentType = (value) => {
  if (value === null || value === undefined) return 'none';
  return value
    .toLowerCase()
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join('; ');
};

export const TEXT_KINDS = ['markdown', 'rss', 'xml', 'text'];

/** Which comparison a response gets, from its content type. */
export const bodyKind = (contentType) => {
  if (contentType.startsWith('text/html')) return 'html';
  if (contentType.startsWith('text/markdown')) return 'markdown';
  if (contentType.startsWith('application/rss+xml')) return 'rss';
  if (contentType.startsWith('application/xml') || contentType.startsWith('text/xml')) return 'xml';
  if (contentType.startsWith('text/plain')) return 'text';
  if (contentType.startsWith('image/png')) return 'png';
  return 'other';
};

// Request-time values that legitimately differ between two renders.
const VOLATILE_PATTERNS = [
  [/<lastBuildDate>[^<]*<\/lastBuildDate>/g, '<lastBuildDate>{now}</lastBuildDate>'],
  [/^Expires: .*$/gm, 'Expires: {expires}'],
];

/** Body text with line endings, trailing whitespace and request-time values normalized. */
export const normalizeTextBody = (body) =>
  VOLATILE_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), body.replace(/\r\n/g, '\n'))
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

/** PNG `WIDTHxHEIGHT` from the IHDR chunk, or `invalid`. */
export const pngDimensions = (bytes) => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || signature.some((byte, index) => bytes[index] !== byte)) return 'invalid';
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return `${view.getUint32(16)}x${view.getUint32(20)}`;
};

/**
 * Comparable record of one response. `response` is
 * `{ status, headers: { get(name) }, text?: string, bytes?: Uint8Array }`.
 */
export const buildRecord = (response) => {
  const contentType = normalizeContentType(response.headers.get('content-type'));
  const kind = response.status >= 300 && response.status < 400 ? 'redirect' : bodyKind(contentType);
  const base = {
    status: `${response.status}`,
    'content-type': response.status >= 300 && response.status < 400 ? 'n/a' : contentType,
    'cache-control': classifyCacheControl(response.headers.get('cache-control')),
  };
  switch (kind) {
    case 'redirect':
      return { ...base, location: response.headers.get('location') ?? 'none' };
    case 'html':
      return { ...base, ...extractHTMLFields(response.text ?? '') };
    case 'markdown':
    case 'rss':
    case 'xml':
    case 'text':
      return { ...base, body: normalizeTextBody(response.text ?? '') };
    case 'png':
      return { ...base, png: pngDimensions(response.bytes ?? new Uint8Array()) };
    case 'other':
      return base;
  }
};

/** Fields whose values differ between two records (`undefined` prints as `∅`). */
export const diffRecords = (a, b) => {
  const fields = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return fields.filter((field) => a[field] !== b[field]).map((field) => ({ field, a: a[field] ?? '∅', b: b[field] ?? '∅' }));
};

const matchesValue = (expected, actual) => (expected instanceof RegExp ? expected.test(actual) : expected === actual);

// `path`, `field`, `a` and `b` are each a string (exact) or a RegExp.
const matchesEntry = (entry, path, diff) => matchesValue(entry.path, path) && matchesValue(entry.field, diff.field) && matchesValue(entry.a, `${diff.a}`) && matchesValue(entry.b, `${diff.b}`);

/**
 * Split diffs into accepted (a whitelist entry matches the path, field and BOTH values)
 * and mismatches. Returns the whitelist entries that were used, so unused ones can be reported.
 */
export const applyWhitelist = (path, diffs, whitelist) => {
  const results = diffs.map((diff) => ({ diff, entry: whitelist.find((entry) => matchesEntry(entry, path, diff)) }));
  return {
    accepted: results.filter(({ entry }) => entry !== undefined),
    mismatches: results.filter(({ entry }) => entry === undefined).map(({ diff }) => diff),
  };
};
