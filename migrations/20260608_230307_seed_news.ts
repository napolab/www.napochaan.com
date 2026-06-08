import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'news', limit: 1 })
  if (existing.docs.length > 0) return

  const newsData = [
    {
      title: '#Booth2Booth vol.03 を VRChat で開催（ゲスト @Rei_ayanami__Jj）',
      publishedAt: '2026-06-06T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/2063217578395279809',
    },
    {
      title: '神田Roost シーシャ DJ オールナイト開催（フライヤー制作）',
      publishedAt: '2026-05-30T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/2056691334229201294',
    },
    {
      title: '主催 Booth2Booth vol.02 を VRChat で開催（フライヤー制作）',
      publishedAt: '2026-05-23T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/2050895908850762215',
    },
    {
      title: 'PROLOGUE at IV AKIHABARA を開催',
      publishedAt: '2026-05-08T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/2042951785502118342',
    },
    {
      title: '#ProjectCircles 椎乃味醂ライブにモーキャプシステムで参加（大規模ライブ）',
      publishedAt: '2026-05-05T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/2051632371590701138',
    },
    {
      title: 'Booth2Booth vol.01 始動（リアル × VR の VRDJ イベント、初回ゲスト 好き）',
      publishedAt: '2026-04-24T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/2038209695996158212',
    },
    {
      title: 'Booth2Booth 公式サイト（booth2booth.com）公開',
      publishedAt: '2026-04-12T00:00:00.000Z',
      category: 'release',
      url: 'https://x.com/naporin24690/status/2043185292337975601',
    },
    {
      title: '「超すごい DJ イベント」を VRChat で開催（Booth2Booth 誕生のきっかけ）',
      publishedAt: '2026-02-20T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/napochaan_vrc2/status/2022521138967122056',
    },
    {
      title: '企画展『思弁的な音楽』に参加（r-906《額縁の言葉 : I》背景映像・システム構築）',
      publishedAt: '2025-12-10T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/1998715240075374793',
    },
    {
      title: '企画展『共に在る音楽』に参加（DEMiXUS / W♭Y♭K M♭C K システム制作）',
      publishedAt: '2024-12-12T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/1867179943060504598',
    },
    {
      title: '企画展『拡張される音楽』(2回目) に参加（「多面体、鏡面」+ LLM 即時更新システム）',
      publishedAt: '2024-11-29T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/1862529523344187817',
    },
    {
      title: 'Hono Conference 2024 で登壇（英語・大型カンファレンス）',
      publishedAt: '2024-06-22T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/naporin24690/status/1804542363895001374',
    },
    {
      title: '企画展『拡張される音楽』(1回目) に参加（「多面体、鏡面」@ 大阪関西国際芸術祭2023, StudioGnu×たなか合作）',
      publishedAt: '2023-12-20T00:00:00.000Z',
      category: 'live',
      url: 'https://x.com/sheeno3rin/status/1738184053508239618',
    },
  ]

  for (const item of newsData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'news', data: { ...item, _status: 'published' } as any })
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
