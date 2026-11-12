import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Media } from '@payload-types';
import type { Payload } from 'payload';

// Reads a media binary straight from the R2 binding and writes it under
// `targetAssetsDir`, but ONLY if the target path does not yet exist (hand-curated
// / generated assets are never clobbered). Reading from R2 directly — rather than
// fetching `media.url` over HTTP — means `seed:export` no longer depends on a
// running dev server; the Payload bin already holds the local miniflare binding.
// Never throws: one bad media must not abort the whole export run.

// Minimal slice of R2Bucket this module needs. The real (global) R2Bucket is
// structurally assignable, and a unit test can supply just `get`.
type MediaBucket = {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
};

type SeedLogger = Pick<Payload['logger'], 'info' | 'warn'>;

export const saveMediaFile = async (media: number | Media | null | undefined, targetAssetsDir: string, bucket: MediaBucket, logger: SeedLogger): Promise<void> => {
  if (media === null || media === undefined || typeof media === 'number') return;

  const { filename } = media;
  if (filename === null || filename === undefined || filename === '') {
    logger.warn('[seed:export] saveMediaFile: skipping media with no filename');
    return;
  }

  const destPath = path.resolve(targetAssetsDir, filename);

  // The R2 object key equals the filename (no prefix configured), matching the
  // storage-r2 static handler. Skip-if-exists protects curated assets.
  const alreadyExists = await access(destPath).then(
    () => true,
    () => false,
  );
  if (alreadyExists) {
    logger.info(`[seed:export] saveMediaFile: skip (exists) ${filename}`);
    return;
  }

  try {
    const object = await bucket.get(filename);
    if (object === null) {
      logger.warn(`[seed:export] saveMediaFile: R2 object not found for ${filename}`);
      return;
    }
    const buffer = Buffer.from(await object.arrayBuffer());
    await writeFile(destPath, buffer);
    logger.info(`[seed:export] saveMediaFile: wrote ${filename} → ${path.relative(process.cwd(), destPath)}`);
  } catch (err) {
    logger.warn(`[seed:export] saveMediaFile: error saving ${filename} — ${err instanceof Error ? err.message : `${err}`}`);
  }
};
