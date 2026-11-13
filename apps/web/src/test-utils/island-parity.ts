import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { ComponentType } from 'react';

// The framework-free client leaves: `.astro` components driven by a custom element
// (see .claude/rules/astro-islands.md). Each element is a `display: contents` wrapper
// around the markup the React original renders, so parity drops the wrapper like an
// astro-island; none ships an island, so pages count them positively instead.
export const CLIENT_LEAF_ELEMENTS = [
  'blank-dim',
  'boot-question',
  'copy-hash-button',
  'cursor-presence',
  'cursor-presence-demo',
  'echo-text',
  'no-action',
  'game-of-life',
  'retry-button',
  'scramble-text',
  'scroll-range-sync',
  'share-bar',
  'sys-bar',
  'typewriter-text',
  'typography-band',
] as const;

// `(?![\\w-])` instead of `\\b`: a tag boundary, so `cursor-presence` never matches a
// longer custom tag that starts with it.
const TAG_END = '(?![\\w-])';

const LEAF_ELEMENT_TAG = new RegExp(`<\\/?(${CLIENT_LEAF_ELEMENTS.join('|')})${TAG_END}[^>]*>`, 'g');

// Normalizes a rendered fragment so an `.astro` twin (leaf islands) and its React
// Server Component original (one tree) compare equal when their markup matches:
// drops Astro's island / slot wrappers and hydration scripts, the custom-element
// wrappers of CLIENT_LEAF_ELEMENTS (display: contents, like astro-island — the markup
// inside is the React original's) with their bundled module scripts, React's
// text-split comments and react-aria's generated ids. An empty attribute value is
// dropped (`data-label=""` ≡ `data-label` in the DOM; Astro serializes the short form),
// and a self-closed void element is unclosed (React writes `<wbr/>`, Astro `<wbr>`).
export const stripIslands = (html: string): string =>
  html
    .replace(/<style>astro-island[^<]*<\/style>/g, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '')
    .replace(/<script type="module" src="[^"]*\?astro&type=script[^"]*"><\/script>/g, '')
    .replace(/<\/?astro-(island|slot|static-slot)\b[^>]*>/g, '')
    .replace(LEAF_ELEMENT_TAG, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ id="react-aria[^"]*"/g, '')
    .replace(/=""/g, '')
    .replace(/<(wbr|br|hr|img|input)\b([^>]*?)\/>/g, '<$1$2>')
    .replace(/>\s+</g, '><')
    .trim();

// `.astro` twins mark a `trigger="group"` ScrambleText's hover host with
// `data-scramble-host`; the React originals pass the host as a value instead, so the
// marker is dropped before a parity comparison.
export const stripScrambleHost = (html: string): string => html.replace(/ data-scramble-host(="[^"]*")?/g, '');

// The island exports in a rendered fragment, in document order.
export const islandExportsOf = (html: string): string[] => [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1] ?? '');

export const renderReactMarkup = <P extends object>(component: ComponentType<P>, props: P): string => stripIslands(renderToStaticMarkup(createElement(component, props)));

// Island exports that wrap a client leaf ('use client' in apps/web, or a colophon demo
// leaf). Pages may hydrate nothing else. Leaves shipped as custom elements are listed in
// CLIENT_LEAF_ELEMENTS instead.
export const CLIENT_LEAF_ISLANDS: ReadonlySet<string> = new Set([
  'ButtonIsland',
  'CalendarIsland',
  'ContactFormIsland',
  'GalleryIsland',
  'LightboxIsland',
  'LivePreviewIsland',
  'LogCalendarIsland',
  'QuoteShareIsland',
  'TextAreaIsland',
  'TextFieldIsland',
]);

// The island exports rendered inside the page's <main>.
export const mainIslandsOf = (html: string): string[] => {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  return [...main.matchAll(/<astro-island [^>]*component-export="([^"]+)"/g)].map((match) => match[1] ?? '');
};

// ScrambleText instances rendered as the framework-free `<scramble-text>` element
// (components/scramble-text/scramble-text.astro) — no island, so they never show up
// in an island list; count them positively instead.
export const scrambleTextCountOf = (html: string): number => (html.match(/<scramble-text\b/g) ?? []).length;

// The `<scramble-text>` elements rendered inside the page's <main>.
export const mainScrambleTextCountOf = (html: string): number => scrambleTextCountOf(html.slice(html.indexOf('<main'), html.indexOf('</main>')));

const LEAF_ELEMENT_OPEN = new RegExp(`<(${CLIENT_LEAF_ELEMENTS.join('|')})${TAG_END}`, 'g');

// The CLIENT_LEAF_ELEMENTS custom elements in a rendered fragment, in document order
// (the element counterpart of islandExportsOf).
export const leafElementsOf = (html: string): string[] => [...html.matchAll(LEAF_ELEMENT_OPEN)].map((match) => match[1] ?? '');

// The CLIENT_LEAF_ELEMENTS custom elements rendered inside the page's <main>.
export const mainLeafElementsOf = (html: string): string[] => leafElementsOf(html.slice(html.indexOf('<main'), html.indexOf('</main>')));

// How many `<tag>` custom elements a fragment renders.
export const leafElementCountOf = (html: string, tag: (typeof CLIENT_LEAF_ELEMENTS)[number]): number => leafElementsOf(html).filter((name) => name === tag).length;
