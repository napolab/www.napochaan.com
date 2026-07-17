import { resolveVideoUploadOutcome } from './validate-video-upload';
import { revalidateTagsAndPaths } from './hooks/revalidate';
import { CACHE_TAGS } from '@utils/cache-tags';

import { ValidationError } from 'payload';

import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload';

// Media is referenced by news SEO images, works thumbnails, and gallery images.
// Bust all dependent caches whenever a media document is changed or deleted.
const revalidateMedia = (): void => revalidateTagsAndPaths([CACHE_TAGS.news, CACHE_TAGS.works, CACHE_TAGS.gallery], ['/', '/news', '/works', '/gallery']);

// Runs on both create AND file-replace-on-update: Payload's `generateFileData`
// populates `req.file` and (for images) `data.width`/`data.height` via sharp
// BEFORE the fields-level `beforeValidate` step, which runs before this
// collection-level `beforeValidate` hook — see
// node_modules/payload/dist/collections/operations/{create,updateByID}.js.
// Using `beforeValidate` (rather than `beforeChange`) mirrors that same core
// convention for auto-populating file-derived fields, and rejecting here
// (instead of in `beforeChange`) stops a non-faststart upload before any
// further field processing/validation runs.
const validateVideoUpload: CollectionBeforeValidateHook = ({ data, req }) => {
  if (data === undefined) return data;

  const file = req.file;
  const outcome = resolveVideoUploadOutcome(file === undefined ? undefined : { mimetype: file.mimetype, data: new Uint8Array(file.data) });

  switch (outcome.kind) {
    case 'skip':
      return data;
    case 'clear':
      return { ...data, duration: null };
    case 'reject':
      throw new ValidationError({
        collection: 'media',
        errors: [{ path: 'file', message: outcome.message }],
      });
    case 'patch':
      return { ...data, ...outcome.patch };
  }
};

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'media', plural: 'media' },
  admin: {
    group: 'システム',
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf', 'video/*'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  hooks: {
    beforeValidate: [validateVideoUpload],
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMedia],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'duration',
      label: '再生時間(秒)',
      type: 'number',
      admin: {
        readOnly: true,
        description: '動画アップロード時に自動設定されます（画像・PDFでは未設定）。',
      },
    },
  ],
};
