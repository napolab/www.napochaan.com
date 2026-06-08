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

type PhotoEntry = {
  filename: string
  alt: string
  caption: string
  mediaAlt?: string
}

const photosData: PhotoEntry[] = [
  {
    filename: 'vrchat-glitch.jpg',
    alt: 'napochaan のアバター milfy v3.0.0 m001',
    caption: 'milfy v3.0.0 m001',
  },
  {
    filename: 'vrchat-square.jpg',
    alt: 'napochaan のアバター milfy v3.0.0 m002',
    caption: 'milfy v3.0.0 m002',
  },
  {
    filename: 'vrchat-alice.jpg',
    alt: 'napochaan のアバター milfy v3.0.0 m003',
    caption: 'milfy v3.0.0 m003',
  },
  {
    filename: 'vrchat-wide.jpg',
    alt: 'VRChat で遊んでいる様子',
    caption: 'VRChat',
  },
  {
    filename: 'flyer-booth-0523.jpg',
    alt: 'Booth²Booth イベントフライヤー 05.23',
    caption: 'flyer / 05.23',
  },
  {
    filename: 'flyer-booth-0424.jpg',
    alt: 'Booth²Booth イベントフライヤー 04.24',
    caption: 'flyer / 04.24',
  },
  {
    filename: 'flyer-sugoi-dj.jpg',
    alt: '「超すごい DJ イベント」フライヤー（本人制作）',
    caption: 'flyer / 超すごい DJ',
  },
  {
    filename: 'flyer-kanda-roost.jpg',
    alt: '神田Roost シーシャ DJ オールナイト フライヤー（本人制作）',
    caption: 'flyer / 神田Roost',
  },
  {
    filename: 'flyer-otiru-soudan.png',
    // mediaAlt matches the works migration so the media row deduplicates
    mediaAlt: 'ちこく×おてぃる お悩み相談かふぇ ポスター',
    alt: 'ちこく×おてぃる お悩み相談かふぇ ポスター（本人制作）',
    caption: 'flyer / お悩み相談かふぇ',
  },
]

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'gallery', limit: 1 })
  if (existing.docs.length > 0) return

  for (const [index, photo] of photosData.entries()) {
    const image = await ensureMedia(payload, photo.mediaAlt ?? photo.alt, photo.filename)
    await payload.create({
      collection: 'gallery',
      data: {
        image,
        caption: photo.caption,
        alt: photo.alt,
        order: index + 1,
        _status: 'published',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
