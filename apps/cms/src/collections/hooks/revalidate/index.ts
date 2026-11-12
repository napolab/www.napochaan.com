import { requestWebPurge } from './request-web-purge';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload';

// Read the optional draft status off any document. Status-less collections yield undefined.
const statusOf = (doc: unknown): 'draft' | 'published' | null | undefined => (doc as { _status?: 'draft' | 'published' | null } | null | undefined)?._status;

/** Whether a document is currently published. */
export const isPublished = (doc: unknown): boolean => statusOf(doc) === 'published';

/** Whether a change touches the published state — the doc is, or just was, published. */
export const isPublishedChange = (doc: unknown, previousDoc: unknown): boolean => isPublished(doc) || isPublished(previousDoc);

// `disableRevalidate` is the explicit opt-out used by seed/import writes.
const purge = (req: PayloadRequest): void => {
  const context = req.context as { disableRevalidate?: boolean };
  if (context.disableRevalidate === true) return;
  requestWebPurge();
};

type PurgeHooks = { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook };

/** For draft-enabled collections: purge the web cache only when the published state is touched. */
export const createPublishedPurgeHooks = (): PurgeHooks => ({
  afterChange: ({ doc, previousDoc, req }) => {
    if (isPublishedChange(doc, previousDoc)) purge(req);
    return doc;
  },
  afterDelete: ({ doc, req }) => {
    if (isPublished(doc)) purge(req);
    return doc;
  },
});

/** For collections/globals without drafts (media, profile): purge on every change. Structurally fits collection/global `afterChange` and collection `afterDelete`. */
export const purgeOnChange = <TDoc>({ doc, req }: { doc: TDoc; req: PayloadRequest }): TDoc => {
  purge(req);
  return doc;
};
