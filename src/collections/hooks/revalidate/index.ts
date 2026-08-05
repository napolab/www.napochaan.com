import { revalidatePath, revalidateTag } from 'next/cache';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload';

// Read the optional draft status off any document. Status-less collections yield undefined.
const statusOf = (doc: unknown): 'draft' | 'published' | null | undefined => (doc as { _status?: 'draft' | 'published' | null } | null | undefined)?._status;

/** Whether a document is currently published. */
export const isPublished = (doc: unknown): boolean => statusOf(doc) === 'published';

/** Whether a change touches the published state — the doc is, or just was, published. */
export const isPublishedChange = (doc: unknown, previousDoc: unknown): boolean => isPublished(doc) || isPublished(previousDoc);

const dispatch = (req: PayloadRequest, tags: readonly string[]): void => {
  const context = req.context as { disableRevalidate?: boolean };
  if (context.disableRevalidate === true) return;
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // revalidateTag throws outside a Next request context (e.g. `payload migrate`/`seed`
      // CLI calling payload.create). Those writes surface on the next build/request, so
      // swallowing is safe. The `disableRevalidate` context flag is the explicit opt-out.
    }
  }
};

// Bust one path-keyed HTML entry. A dynamic pattern path (`/blog/[slug]`) must be
// revalidated with type 'page' — it busts EVERY rendered page of that route (Next
// tags each page with `_N_T_<pattern>/page`), which is what keeps cross-document
// derivations (prev/next navigation, adjacent lists) fresh without a time window.
const dispatchPath = (path: string): void => {
  if (path.includes('[')) {
    revalidatePath(path, 'page');
    return;
  }
  revalidatePath(path);
};

// Bust both the cache tags and the ISR path HTML. Mirrors `dispatch`'s opt-out and
// swallows the throw outside a Next request context (CLI seed/migrate).
const dispatchTagsAndPaths = (req: PayloadRequest, tags: readonly string[], paths: readonly string[]): void => {
  const context = req.context as { disableRevalidate?: boolean };
  if (context.disableRevalidate === true) return;
  try {
    for (const tag of tags) revalidateTag(tag);
    for (const path of paths) dispatchPath(path);
  } catch {
    // Outside a request context (CLI seed/migrate). Those writes surface on the next
    // build/request, so swallowing is safe. `disableRevalidate` is the explicit opt-out.
  }
};

/** Safely bust a fixed set of cache tags + ISR paths. Swallows the
 * "static generation store missing" throw that happens outside a Next request
 * context (e.g. CLI seed/migrate). Use for non-draft collections / globals whose
 * data fans out to multiple consumers. */
export const revalidateTagsAndPaths = (tags: readonly string[], paths: readonly string[]): void => {
  try {
    for (const tag of tags) revalidateTag(tag);
    for (const path of paths) dispatchPath(path);
  } catch {
    // Outside a request context (CLI). Safe to swallow.
  }
};

type RevalidateHooks = { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook };

/** For collections WITHOUT drafts: bust the tags on every change/delete. */
export const createTagRevalidateHooks = (tags: readonly string[]): RevalidateHooks => ({
  afterChange: ({ doc, req }) => {
    dispatch(req, tags);
    return doc;
  },
  afterDelete: ({ doc, req }) => {
    dispatch(req, tags);
    return doc;
  },
});

/** For draft-enabled collections: bust only when published state is touched. */
export const createPublishedTagRevalidateHooks = (tags: readonly string[]): RevalidateHooks => ({
  afterChange: ({ doc, previousDoc, req }) => {
    if (isPublishedChange(doc, previousDoc)) dispatch(req, tags);
    return doc;
  },
  afterDelete: ({ doc, req }) => {
    if (isPublished(doc)) dispatch(req, tags);
    return doc;
  },
});

/** For draft-enabled collections whose data fans out to ISR pages: bust both the cache
 * tags AND the path-keyed ISR HTML (list/home + detail pages, via a `[slug]` pattern
 * path) when the published state is touched. */
export const createPublishedTagAndPathRevalidateHooks = (tags: readonly string[], paths: readonly string[]): RevalidateHooks => ({
  afterChange: ({ doc, previousDoc, req }) => {
    if (isPublishedChange(doc, previousDoc)) dispatchTagsAndPaths(req, tags, paths);
    return doc;
  },
  afterDelete: ({ doc, req }) => {
    if (isPublished(doc)) dispatchTagsAndPaths(req, tags, paths);
    return doc;
  },
});
