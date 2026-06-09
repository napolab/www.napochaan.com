import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'logs', limit: 1 })
  if (existing.docs.length > 0) return

  const logsData = [
    // 2026
    {
      title: '#39Pop × #39mix at nagomix(渋谷) に VJ 出演',
      date: '2026-07-26T00:00:00.000Z',
      meta: 'VJ',
    },
    {
      title: '#hakai vol.4 at IV AKIHABARA に VJ 出演',
      date: '2026-07-04T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2052399732870500832',
    },
    {
      title: "Halfmoo'n' at 代官山 THEATER GUILD に VJ 出演",
      date: '2026-07-03T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2061770618316751163',
    },
    {
      title: 'ADMA vol.6 at CLUB PLUM に VJ 出演',
      date: '2026-06-20T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2061409831681138898',
    },
    {
      title: '#VRC電音研 at VRChat に DJ 出演',
      date: '2026-06-03T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2062118071696011384',
    },
    {
      title: '#Randmizer at IV AKIHABARA に DJ 出演',
      date: '2026-05-28T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2056571808514703540',
    },
    {
      title: 'ぱろんBIRTHDAY BASH at VRChat に DJ/VJ 出演',
      date: '2026-05-15T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/napochaan_vrc2/status/2050196551948214556',
    },
    {
      title: 'Initium at VRChat に VJ 出演',
      date: '2026-05-14T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/napochaan_vrc2/status/2054812997110177822',
    },
    {
      title: '#Try_it vol.5 SP at PUBLIC PUBLIC に DJ 出演',
      date: '2026-05-06T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2047289981081960453',
    },
    {
      title: 'livrise. -incident- at PUBLIC PUBLIC SHIBUYA に VJ 出演',
      date: '2026-05-02T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2048738372085330122',
    },
    {
      title: 'Initium vol.13 at VRChat に DJ/VJ 出演',
      date: '2026-04-29T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/napochaan_vrc2/status/2047236150482583618',
    },
    {
      title: 'Initium:IRL at IV AKIHABARA に DJ 出演',
      date: '2026-04-11T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2031692995368796579',
    },
    {
      title: '#いくらうど に VJ 出演',
      date: '2026-04-10T00:00:00.000Z',
      meta: 'VJ',
      url: 'https://x.com/naporin24690/status/2040093405699846467',
    },
    {
      title: 'がんもん 誕生日パーティー at VRChat に DJ 出演',
      date: '2026-03-17T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2032057441299702270',
    },
    {
      title: 'Initium at VRChat に DJ 出演',
      date: '2026-03-15T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2031694135057678429',
    },
    {
      title: 'あめぱん 誕生日 at VRChat に DJ 出演',
      date: '2026-03-14T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2031691805297930507',
    },
    {
      title: 'nago 誕生日パーティー at VRChat に DJ 出演',
      date: '2026-01-30T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2016751258326225126',
    },
    {
      title: 'Initium vol.10 at VRChat に DJ 出演',
      date: '2026-01-24T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2015005908435419205',
    },
    {
      title: 'FLICK Vol.2 at IV AKIHABARA に DJ 出演',
      date: '2026-01-22T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2012353999576736178',
    },
    {
      title: 'Initium at VRChat に DJ 出演',
      date: '2026-01-04T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2007765624781721994',
    },
    // 2025
    {
      title: 'FLICK vol.1 at altoto 下北沢 に DJ 出演',
      date: '2025-12-13T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/1994028242781590003',
    },
    {
      title: 'LOG（アルトト25周年）at altoto に DJ 出演',
      date: '2025-11-03T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/1982700926864634345',
    },
    {
      title: 'ちこく 誕生日イベント at VRChat に DJ 出演',
      date: '2025-11-02T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1984560051710017773',
    },
    {
      title: '#SAKURA_MOONLIGHT RoguE に DJ 出演',
      date: '2025-09-27T00:00:00.000Z',
      meta: 'DJ',
    },
    {
      title: 'Initium at VRChat に DJ 出演',
      date: '2025-09-22T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1964916711574143203',
    },
    {
      title: 'napochaan 誕生日 DJ（なぽなご）at VRChat に DJ 出演',
      date: '2025-08-17T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/1956306353821307081',
    },
    // 主催イベント
    {
      title: 'Booth2Booth vol.03 at VRChat 開催',
      date: '2026-06-06T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/naporin24690/status/2063217578395279809',
    },
    {
      title: '神田Roost シーシャ DJ オールナイト at 神田Roost 開催',
      date: '2026-05-30T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/naporin24690/status/2056691334229201294',
    },
    {
      title: 'Booth2Booth vol.02 at VRChat 開催',
      date: '2026-05-23T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/naporin24690/status/2050895908850762215',
    },
    {
      title: 'PROLOGUE at IV AKIHABARA 開催',
      date: '2026-05-08T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/naporin24690/status/2042951785502118342',
    },
    {
      title: 'Booth2Booth vol.01 at VRChat 開催',
      date: '2026-04-24T00:00:00.000Z',
      meta: 'DJ/VJ',
      url: 'https://x.com/naporin24690/status/2038209695996158212',
    },
    {
      title: '超すごい DJ イベント at VRChat 開催',
      date: '2026-02-20T00:00:00.000Z',
      meta: 'DJ',
      url: 'https://x.com/napochaan_vrc2/status/2022521138967122056',
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
