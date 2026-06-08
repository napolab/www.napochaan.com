import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-d1-sqlite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const ensureMedia = async (payload: MigrateUpArgs['payload'], alt: string, filename: string): Promise<number> => {
  const existing = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1 })
  const [first] = existing.docs
  if (first !== undefined) {
    return first.id as number
  }
  const filePath = path.resolve(dirname, '..', 'src', 'assets', filename)
  const created = await payload.create({ collection: 'media', data: { alt }, filePath })
  return created.id as number
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'gallery', limit: 1 })
  if (existing.docs.length > 0) return

  // Ordered to match sample-gallery.ts order; use same alt keys as seed_works ensureMedia
  // so existing media rows are reused rather than duplicated.
  const photosData = [
    { filename: 'flyer-booth-0424.jpg', alt: 'flyer-booth-0424', caption: 'flyer / 04.24' },
    { filename: 'gallery-vrchat-stage.jpg', alt: 'gallery-vrchat-stage', caption: 'VRChat' },
    { filename: 'vrchat-square.jpg', alt: 'vrchat-square', caption: 'frame' },
    { filename: 'gallery-flyer-techno.jpg', alt: 'gallery-flyer-techno', caption: 'flyer' },
    { filename: 'gallery-vrchat-crowd.jpg', alt: 'gallery-vrchat-crowd', caption: 'VRChat' },
    { filename: 'vrchat-alice.jpg', alt: 'vrchat-alice', caption: 'ALICE' },
    { filename: 'gallery-vrchat-avatar.jpg', alt: 'gallery-vrchat-avatar', caption: 'avatar' },
    { filename: 'gallery-flyer-dnb.jpg', alt: 'gallery-flyer-dnb', caption: 'flyer / DNB' },
    { filename: 'gallery-vrchat-booth.jpg', alt: 'gallery-vrchat-booth', caption: 'VRChat' },
    { filename: 'vrchat-glitch.jpg', alt: 'vrchat-glitch', caption: 'glitch' },
    { filename: 'gallery-vrchat-frame.jpg', alt: 'gallery-vrchat-frame', caption: 'frame' },
    { filename: 'flyer-booth-0523.jpg', alt: 'flyer-booth-0523', caption: 'flyer / 05.23' },
    { filename: 'vrchat-wide.jpg', alt: 'vrchat-wide', caption: 'VRChat' },
    { filename: 'gallery-vrchat-vertical.jpg', alt: 'gallery-vrchat-vertical', caption: 'VRChat' },
    { filename: 'gallery-flyer-ambient.jpg', alt: 'gallery-flyer-ambient', caption: 'flyer' },
  ]

  for (const [index, photo] of photosData.entries()) {
    const mediaId = await ensureMedia(payload, photo.alt, photo.filename)
    await payload.create({
      collection: 'gallery',
      data: {
        image: mediaId,
        caption: photo.caption,
        order: index + 1,
        _status: 'published',
      },
    })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
