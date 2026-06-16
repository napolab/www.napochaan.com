import { revalidatePath, revalidateTag } from 'next/cache';

import { findBlogSlugsEmbeddingSoftware } from '@lib/payload/software/find-embedding-blog-slugs';
import { referenceId } from '@lib/software/collect-software-ids';
import { CACHE_TAGS } from '@utils/cache-tags';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload';

// Bust the software data tag, then the ISR HTML of every blog post embedding this
// release's software (the block renders the latest version, so a new release changes
// already-published articles). Swallow throws outside a request context (CLI seed).
const revalidateReleaseAndEmbedders = async (softwareRef: unknown): Promise<void> => {
  const softwareId = referenceId(softwareRef);
  if (softwareId === undefined) return;

  try {
    revalidateTag(CACHE_TAGS.software);
    const slugs = await findBlogSlugsEmbeddingSoftware(softwareId);
    for (const slug of slugs) revalidatePath(`/blog/${slug}`);
  } catch {
    // Outside a Next request context (CLI migrate/seed). Surfaces on next build.
  }
};

const afterChange: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidateReleaseAndEmbedders(doc.software);
  return doc;
};
const afterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidateReleaseAndEmbedders(doc.software);
  return doc;
};

// One binary = one version of a `software` product. Upload-backed (bytes in R2 under
// the `releases/` prefix). `read` is admin-only on purpose: the public never reads a
// release directly — the site renders release metadata server-side with
// overrideAccess, and bytes are served only through the signed /api/software/download
// route. This also makes Payload's built-in file route return 403 for the public, so
// there is no public direct download link.

export const SoftwareRelease = {
  slug: 'software-release',
  labels: { singular: 'リリース', plural: 'リリース' },
  defaultSort: '-releasedAt',
  upload: {
    // Distribution archives. octet-stream is the catch-all for unknown binaries.
    mimeTypes: ['application/zip', 'application/gzip', 'application/x-gtar', 'application/octet-stream', 'application/x-apple-diskimage'],
  },
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'software', 'releasedAt'],
  },
  access: {
    read: ({ req: { user } }) => user !== null,
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  hooks: {
    afterChange: [afterChange],
    afterDelete: [afterDelete],
  },
  fields: [
    {
      name: 'software',
      label: 'ソフトウェア',
      type: 'relationship',
      relationTo: 'software',
      required: true,
      admin: { position: 'sidebar' },
    },
    { name: 'version', label: 'バージョン', type: 'text', required: true, admin: { description: '例: 1.1.0' } },
    {
      name: 'releasedAt',
      label: 'リリース日',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    {
      name: 'changelog',
      label: '変更点',
      type: 'textarea',
      admin: { description: '任意。GitHub Release のように、この版で何が変わったかを書く。' },
    },
  ],
} satisfies CollectionConfig;
