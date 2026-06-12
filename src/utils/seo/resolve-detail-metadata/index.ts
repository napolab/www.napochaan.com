import { extractPlainText } from '@utils/lexical/extract-plain-text';

import type { Metadata } from 'next';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// The admin-entered SEO group, already coerced to the consumed shape (NULLs →
// undefined, populated media → its url string) at the data-layer boundary.
type DetailSeo = {
  title?: string;
  description?: string;
  image?: string;
};

export type ResolveDetailMetadataArgs = {
  docTitle: string;
  // Canonical path, emitted as the relative og:url (resolved via metadataBase).
  path: string;
  seo?: DetailSeo;
  body?: SerializedEditorState;
  // Entity-specific description sources tried in order before the body excerpt
  // (e.g. blog `excerpt`, works `description`). Empty strings are ignored.
  descriptionCandidates?: readonly (string | undefined)[];
  // Accepted but ignored: the file-convention `opengraph-image.tsx` route now
  // owns og:image / twitter:image for detail pages, so this helper no longer
  // emits explicit images. Kept so the three call sites compile unchanged.
  imageCandidates?: readonly (string | undefined)[];
  // Per-page generic JP fallback when no description source yields text.
  genericDescription: string;
  // Accepted but ignored — see `imageCandidates`.
  defaultImage: string;
};

const SUFFIX = ' — napochaan';
const SITE_NAME = 'napochaan';
const MAX_DESCRIPTION = 120;

// The first non-empty string in a candidate list, or undefined when none qualify.
const firstNonEmpty = (candidates: readonly (string | undefined)[]): string | undefined => {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== '') return candidate;
  }

  return undefined;
};

// Collapses runs of whitespace to a single space and trims the ends.
const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

// Truncates to ~MAX_DESCRIPTION chars on a word boundary, appending an ellipsis
// when text was dropped. Returns the input unchanged when already short enough.
const truncate = (value: string): string => {
  if (value.length <= MAX_DESCRIPTION) return value;

  const slice = value.slice(0, MAX_DESCRIPTION);
  const lastSpace = slice.lastIndexOf(' ');
  const head = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;

  return `${head.trimEnd()}…`;
};

// The body excerpt: plain text from the rich-text body, collapsed and truncated.
// Returns undefined when the body is absent or yields no text.
const bodyExcerpt = (body?: SerializedEditorState): string | undefined => {
  const text = collapseWhitespace(extractPlainText(body));
  if (text === '') return undefined;

  return truncate(text);
};

// First non-empty: meta → field candidates → body excerpt → generic fallback.
const resolveDescription = (args: ResolveDetailMetadataArgs): string => {
  const fromCandidates = firstNonEmpty([args.seo?.description, ...(args.descriptionCandidates ?? [])]);
  if (fromCandidates !== undefined) return fromCandidates;

  return bodyExcerpt(args.body) ?? args.genericDescription;
};

// Builds a Next `Metadata` object from the admin `meta` group with content-derived
// fallbacks. When `meta.title` is set it is the complete title (bypasses the root
// `%s — napochaan` template via `absolute`); otherwise the bare docTitle is
// returned so the template appends the suffix. og:image / twitter:image are
// intentionally NOT emitted — the file-convention `opengraph-image.tsx` route
// owns them for detail pages (emitting them here would override that). Pure.
export const resolveDetailMetadata = (args: ResolveDetailMetadataArgs): Metadata => {
  const description = resolveDescription(args);
  const metaTitle = args.seo?.title;
  const hasMetaTitle = metaTitle !== undefined && metaTitle !== '';
  const displayTitle = hasMetaTitle ? metaTitle : `${args.docTitle}${SUFFIX}`;

  return {
    title: hasMetaTitle ? { absolute: metaTitle } : args.docTitle,
    description,
    alternates: { canonical: args.path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ja_JP',
      url: args.path,
      title: displayTitle,
      description,
    },
    twitter: { card: 'summary_large_image', title: displayTitle, description },
  };
};
