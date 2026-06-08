import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'logs', limit: 1 })
  if (existing.docs.length > 0) return

  const logsData = [
    // 2026
    {
      title: '#39Pop × #39mix に Guest VJ 出演（nagomix 渋谷, 13:00–20:00）',
      date: '2026-07-26T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2056571808514703540',
    },
    {
      title: "Halfmoo'n' に VJ 出演（フォトアート × VJ, 20:00–5:00）",
      date: '2026-07-03T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2061770618316751163',
    },
    {
      title: '#VRC電音研 に DJ 出演（jesusclub/hyperflip/dubstep/riddim）',
      date: '2026-06-03T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2062118071696011384',
    },
    {
      title: '#ADMA vol.6 at CLUB PLUM に VJ 出演',
      date: '2026-05-27T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2061409831681138898',
    },
    {
      title: '#Randmizer in IV AKIHABARA に DJ 出演',
      date: '2026-05-18T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2056571808514703540',
    },
    {
      title: 'ぱろん 誕生日 DJ/VJ（ボカロ/アニメリミックス）',
      date: '2026-05-15T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/napochaan_vrc2/status/2050196551948214556',
    },
    {
      title: '初の VJ only 出演',
      date: '2026-05-14T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/napochaan_vrc2/status/2054812997110177822',
    },
    {
      title: '#hakai vol.4 に VJ 出演（自作 VJ ソフト）',
      date: '2026-05-07T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2048738372085330122',
    },
    {
      title: '#Try_it vol.5 SP に DJ 出演（PUBLIC PUBLIC）',
      date: '2026-05-06T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2047289981081960453',
    },
    {
      title: 'livrise. -incident- at #PUBLICPUBLIC_SHIBUYA に VJ 出演（15:00–23:00）',
      date: '2026-05-02T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2048738372085330122',
    },
    {
      title: 'ARENA で VJ 出演',
      date: '2026-04-29T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/napochaan_vrc2/status/2047236150482583618',
    },
    {
      title: 'Initium:IRL に DJ 出演（IV AKIHABARA, 3番手 18:20, フライヤー/タイテ公開）',
      date: '2026-04-11T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2031692995368796579',
    },
    {
      title: '#いくらうど に VJ 出演（後半, ric3show3r）',
      date: '2026-04-03T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2040093405699846467',
    },
    {
      title: 'DJ 出演（hyperflip, わぶくら後）',
      date: '2026-03-15T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2031691805297930507',
    },
    {
      title: 'がんもん 誕生日 DJ（ドパガキ早回し）',
      date: '2026-03-12T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2032057441299702270',
    },
    {
      title: 'あめぱん 誕生日 DJ',
      date: '2026-03-10T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2031694135057678429',
    },
    {
      title: 'VR で DJ 出演（21:40〜, hyperflip）',
      date: '2026-03-06T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2033148322387742820',
    },
    {
      title: 'nago 遅れた誕生日 DJ パーティー（Nagotzi, 22:00〜, 破壊と替え歌）',
      date: '2026-01-30T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2016751258326225126',
    },
    {
      title: 'Initium vol.10 に DJ 出演（VR, Main, 21:00〜）',
      date: '2026-01-24T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2015005908435419205',
    },
    {
      title: 'FLICK Vol.2 at IV AKIHABARA に DJ 出演（23:00–05:00, ¥1,500+1D）',
      date: '2026-01-22T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2012353999576736178',
    },
    {
      title: '#Harmony0118 あみだくじシステム実装',
      date: '2026-01-18T00:00:00.000Z',
      meta: 'support',
      url: 'https://x.com/naporin24690/status/2012874773630685212',
    },
    {
      title: 'DJ 出演（クリスマスブートレグ + ハイフリ）',
      date: '2026-01-04T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2007765624781721994',
    },
    // 2025
    {
      title: 'FLICK vol.1 at altoto 下北沢 に DJ 出演（15:00–21:00, ¥1,500）',
      date: '2025-12-13T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/1994028242781590003',
    },
    {
      title: 'Vket2025Winter「PrizeSpider」クレーンゲームギミック 一部 Udon 実装',
      date: '2025-12-06T00:00:00.000Z',
      meta: 'support',
      url: 'https://x.com/napochaan_vrc2/status/1998666475687784803',
    },
    {
      title: '「解釈系 / ハーモニー」特設サイト 実装（試聴自動再生）',
      date: '2025-11-16T00:00:00.000Z',
      meta: 'support',
      url: 'https://x.com/naporin24690/status/1990007733005979981',
    },
    {
      title: '現実で DJ 出演（jersey club/hyperflip）',
      date: '2025-10-27T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/1982700926864634345',
    },
    {
      title: 'DJ 出演（jersey club/hyperflip）',
      date: '2025-10-26T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1984560051710017773',
    },
    {
      title: '#SAKURA_MOONLIGHT RoguE に DJ 出演（22:55〜, DnB/HyperFlip）',
      date: '2025-09-27T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1964916711574143203',
    },
    {
      title: 'DJ 出演（22:20〜, Colour/Hyper）',
      date: '2025-09-22T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1956306353821307081',
    },
    {
      title: '誕生日 DJ（22:00〜, なぽなご）',
      date: '2025-08-17T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1956306353821307081',
    },
  ]

  for (const item of logsData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'logs', data: { ...item, _status: 'published' } as any })
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
