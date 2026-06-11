import { extractPlainText } from '@utils/lexical/extract-plain-text';
import { firstImageSrc } from '@utils/lexical/first-image-src';

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
  seo?: DetailSeo;
  body?: SerializedEditorState;
  // Entity-specific description sources tried in order before the body excerpt
  // (e.g. blog `excerpt`, works `description`). Empty strings are ignored.
  descriptionCandidates?: readonly (string | undefined)[];
  // Entity-specific image sources tried in order before the body image
  // (e.g. works `thumbnail.src`). Empty strings are ignored.
  imageCandidates?: readonly (string | undefined)[];
  // Per-page generic JP fallback when no description source yields text.
  genericDescription: string;
  // Site default og:image used when no other image source is found.
  defaultImage: string;
};

const SUFFIX = ' — napochaan';
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

// First non-empty: meta → field candidates → first body image → site default.
const resolveImage = (args: ResolveDetailMetadataArgs): string => {
  const fromCandidates = firstNonEmpty([args.seo?.image, ...(args.imageCandidates ?? [])]);
  if (fromCandidates !== undefined) return fromCandidates;

  return firstImageSrc(args.body) ?? args.defaultImage;
};

// Builds a Next `Metadata` object from the admin `meta` group with content-derived
// fallbacks. When `meta.title` is set it is the complete title (bypasses the root
// `%s — napochaan` template via `absolute`); otherwise the bare docTitle is
// returned so the template appends the suffix. Pure.
export const resolveDetailMetadata = (args: ResolveDetailMetadataArgs): Metadata => {
  const description = resolveDescription(args);
  const image = resolveImage(args);
  const metaTitle = args.seo?.title;
  const hasMetaTitle = metaTitle !== undefined && metaTitle !== '';
  const displayTitle = hasMetaTitle ? metaTitle : `${args.docTitle}${SUFFIX}`;

  return {
    title: hasMetaTitle ? { absolute: metaTitle } : args.docTitle,
    description,
    openGraph: { title: displayTitle, description, images: [{ url: image }] },
    twitter: { title: displayTitle, description, images: [image] },
  };
};
