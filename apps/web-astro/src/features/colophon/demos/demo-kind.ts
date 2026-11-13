import type { colophon } from '../content';

// The catalog key set is derived from the content so a name without a demo kind (or
// a kind without a content entry) is a compile error.
export type ComponentName = (typeof colophon.components.items)[number]['name'];

// How each demo is placed by ./demo.astro. In Next every demo sat in one Server
// Component tree and only its client leaves hydrated; in Astro the hydration unit
// must be chosen from `.astro`:
//   - static:           server-only React, no JS (no client module is rendered).
//   - static-no-action: server-only, inside the <NoAction> island (it carries hrefs).
//   - interactive:      one island per demo (./interactive-demos), client:load.
//   - gallery / gallery-archive: client:only="react" (Next lazy-loaded them with
//                       `ssr: false`), with the "loading gallery…" fallback.
export type DemoKind = 'static' | 'static-no-action' | 'interactive' | 'gallery' | 'gallery-archive';

export const demoKinds = {
  ScrambleText: 'interactive',
  EchoText: 'interactive',
  TypewriterText: 'interactive',
  Marquee: 'static',
  Heading: 'static',
  SectionHeading: 'static',
  RichText: 'static-no-action',
  PhrasedText: 'static',
  Card: 'static',
  Figure: 'interactive',
  Gallery: 'gallery',
  GalleryArchive: 'gallery-archive',
  Timeline: 'static',
  NewsRow: 'interactive',
  Table: 'static',
  List: 'static',
  Badge: 'static',
  Tag: 'static',
  SystemAnnotation: 'static',
  Button: 'interactive',
  TextField: 'interactive',
  TextArea: 'interactive',
  Link: 'interactive',
  Divider: 'interactive',
  Pagination: 'interactive',
  Breadcrumbs: 'interactive',
  FeedLink: 'static-no-action',
  Calendar: 'interactive',
  ShareBar: 'interactive',
  BackToIndex: 'interactive',
  QuoteShare: 'interactive',
  DecodingSkeleton: 'interactive',
  TypographyBand: 'static',
  GameOfLife: 'interactive',
  CursorPresence: 'interactive',
  LoadingOverlay: 'interactive',
} as const satisfies Record<ComponentName, DemoKind>;

type NamesOfKind<K extends DemoKind> = { [N in ComponentName]: (typeof demoKinds)[N] extends K ? N : never }[ComponentName];

export type StaticDemoName = NamesOfKind<'static' | 'static-no-action'>;
export type InteractiveDemoName = NamesOfKind<'interactive'>;

export const demoKindOf = (name: ComponentName): DemoKind => demoKinds[name];
