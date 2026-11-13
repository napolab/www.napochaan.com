import type { colophon } from '../content';

// The catalog key set is derived from the content so a name without a demo (or a
// demo without a content entry) is a compile error.
export type ComponentName = (typeof colophon.components.items)[number]['name'];

// How ./demo.astro places each demo. Only client leaves ('use client' in apps/web)
// carry a directive; Server Components stay server-only:
//   - static:           server-only React (./static-demos), no JS.
//   - static-no-action: the same, inside the <NoAction> island (the demo carries
//                       hrefs and must never navigate) as static slot HTML.
//   - composed:         composed in ./demo.astro from server markup + the demo's
//                       client-leaf islands.
export type DemoKind = 'static' | 'static-no-action' | 'composed';

export const demoKinds = {
  ScrambleText: 'composed',
  EchoText: 'composed',
  TypewriterText: 'composed',
  Marquee: 'static',
  Heading: 'static',
  SectionHeading: 'static',
  RichText: 'composed',
  PhrasedText: 'static',
  Card: 'static',
  Figure: 'static',
  Gallery: 'composed',
  GalleryArchive: 'composed',
  Timeline: 'static',
  NewsRow: 'composed',
  Table: 'static',
  List: 'static',
  Badge: 'static',
  Tag: 'static',
  SystemAnnotation: 'static',
  Button: 'composed',
  TextField: 'composed',
  TextArea: 'composed',
  Link: 'static-no-action',
  Divider: 'composed',
  Pagination: 'static-no-action',
  Breadcrumbs: 'composed',
  FeedLink: 'static-no-action',
  Calendar: 'composed',
  ShareBar: 'composed',
  BackToIndex: 'composed',
  QuoteShare: 'composed',
  DecodingSkeleton: 'static',
  TypographyBand: 'static',
  GameOfLife: 'composed',
  CursorPresence: 'composed',
  LoadingOverlay: 'composed',
} as const satisfies Record<ComponentName, DemoKind>;

type NamesOfKind<K extends DemoKind> = { [N in ComponentName]: (typeof demoKinds)[N] extends K ? N : never }[ComponentName];

export type StaticDemoName = NamesOfKind<'static' | 'static-no-action'>;

export const demoKindOf = (name: ComponentName): DemoKind => demoKinds[name];
