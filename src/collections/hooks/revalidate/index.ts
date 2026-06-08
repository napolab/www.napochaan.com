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

/** Safely bust a fixed set of cache tags + ISR paths. Swallows the
 * "static generation store missing" throw that happens outside a Next request
 * context (e.g. CLI seed/migrate). Use for non-draft collections / globals whose
 * data fans out to multiple consumers. */
export const revalidateTagsAndPaths = (tags: readonly string[], paths: readonly string[]): void => {
  try {
    for (const tag of tags) revalidateTag(tag);
    for (const path of paths) revalidatePath(path);
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
