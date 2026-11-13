import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { ComponentType } from 'react';

// Normalizes a rendered fragment so an `.astro` twin (leaf islands) and its React
// Server Component original (one tree) compare equal when their markup matches:
// drops Astro's island / slot wrappers and hydration scripts, React's text-split
// comments and react-aria's generated ids. An empty attribute value is dropped
// (`data-label=""` ≡ `data-label` in the DOM; Astro serializes the short form).
export const stripIslands = (html: string): string =>
  html
    .replace(/<style>astro-island[^<]*<\/style>/g, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '')
    .replace(/<\/?astro-(island|slot|static-slot)\b[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ id="react-aria[^"]*"/g, '')
    .replace(/=""/g, '')
    .replace(/>\s+</g, '><')
    .trim();

export const renderReactMarkup = <P extends object>(component: ComponentType<P>, props: P): string => stripIslands(renderToStaticMarkup(createElement(component, props)));

// Island exports that wrap a client leaf ('use client' in apps/web, or a colophon demo
// leaf). Pages may hydrate nothing else.
export const CLIENT_LEAF_ISLANDS: ReadonlySet<string> = new Set([
  'BootQuestionIsland',
  'ButtonIsland',
  'CalendarIsland',
  'CopyHashButtonIsland',
  'CursorPresenceDemoIsland',
  'DividerIsland',
  'EchoTextIsland',
  'GalleryArchiveIsland',
  'GalleryIsland',
  'IsolatedGameOfLifeIsland',
  'LightboxIsland',
  'NoAction',
  'PostCardIsland',
  'QuoteShareIsland',
  'ScrambleTextIsland',
  'ShareBarIsland',
  'TextAreaIsland',
  'TextFieldIsland',
  'TypewriterTextIsland',
]);

// The island exports rendered inside the page's <main>.
export const mainIslandsOf = (html: string): string[] => {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  return [...main.matchAll(/<astro-island [^>]*component-export="([^"]+)"/g)].map((match) => match[1] ?? '');
};
