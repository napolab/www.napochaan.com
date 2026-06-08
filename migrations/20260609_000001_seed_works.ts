import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-d1-sqlite'

import { richTextFromParagraphs } from '../src/utils/sample-rich-text'

const worksData = [
  {
    no: '01',
    title: 'PAE2.0 ドットレカギミック制作',
    type: 'dev',
    date: '2025-09-13',
    url: 'https://vrchat.com/home/world/wrld_ab2c1526-c1b1-419d-b138-be32591e799f',
    description: 'VRChat で公開されている VRC PIXELART EXHIBITION 2.0 にドット絵組み合わせギミックを制作・提供した。複数人で同じものを見るための同期機能や、VR・Desktop 環境での最適化など、UX を重視した設計を行った。',
  },
  {
    no: '02',
    title: 'まだ知らない君がいる 映像提供',
    type: 'video',
    date: '2025-05-03', // date: inferred (from report context; around 2025-05 MV release)
    url: 'https://x.com/naporin24690/status/1959117309689438582',
    description: '椎乃味醂の楽曲「まだ知らない君がいる - 初音ミク･重音テト」の MV に VRChat で撮影した映像を提供した。',
  },
  {
    no: '03',
    title: 'ボカコレ2025夏 アーカイブ作成',
    type: 'dev',
    date: '2025-08-01', // date: inferred (ボカコレ2025夏 = summer 2025)
    url: 'https://vocaloid-collection-archive.studiognu.org/2025/summer',
    description: 'ボカコレ2025夏の統計情報を Web サイトにまとめた。',
  },
  {
    no: '04',
    title: 'おてぃる誕生日 モザイクアート制作',
    type: 'dev',
    date: '2025-04-01', // date: inferred (spring 2025 birthday project)
    url: 'https://ristill.club/2025',
    description: 'VRChat の推しの誕生日を祝うためにモザイクアートと HP を作成した。20人の協力により約3000枚の画像から24000タイルのモザイクアートを制作。モザイクアート生成用の Rust ツールも開発した。',
  },
  {
    no: '05',
    title: 'VRChat イベントポスター制作',
    type: 'flyer',
    date: '2025-06-01', // date: inferred (from tweet context, VRChat event poster)
    url: 'https://x.com/napochaan_vrc2/status/1929843195313377560',
    description: 'VRChat の個人イベント用ポスター・ロゴを制作した。可愛らしさと情報の伝わりやすさを重視したレイアウトを心がけた。',
  },
  {
    no: '06',
    title: 'AKAGE オマージュ動画制作',
    type: 'video',
    date: '2025-04-17', // date: inferred (tweet date from @ristill_vr/1913064949242360039 = ~April 2025)
    url: 'https://x.com/ristill_vr/status/1913064949242360039',
    description: 'After Effects を使った初めての動画制作で AKAGE オマージュ動画を作成した。アバターのコンセプトに合わせ、可愛さと面白さを重視した編集を心がけた。',
  },
  {
    no: '07',
    title: 'UMANITY HP 制作',
    type: 'dev',
    date: '2025-03-15',
    url: 'https://ahub.jp/umanity/',
    description: 'AHUB のアルバム「UMANITY」の Web サイトを制作した。アルバム紹介コンテンツやクイズなどのインタラクティブなギミックを搭載した HP を作成した。',
  },
  {
    no: '08',
    title: 'ヘイロー化ギミック booth 販売',
    type: 'dev',
    date: '2025-01-01', // date: inferred (VRChat gimmick released, ~early 2025)
    url: 'https://booth.pm/ja/items/6604904',
    description: 'VRChat で好きなオブジェクトを頭上で回転させるヘイローにできるギミックを制作した。ボタン一つで自動配置する仕組みを実装し、フルパック版では13種類のメニューを用意。汎用的な円形配置スクリプトにより頭部以外の部位にも装着可能で、BOOTH で販売中。',
  },
  {
    no: '09',
    title: 'W♭Y♭K M♭C K システム作成',
    type: 'dev',
    date: '2024-12-12',
    url: 'https://x.com/naporin24690/status/1867175063893811585',
    description: '企画展「共に在る音楽」の作品「W ♭Y ♭K M ♭C K」のシステムを設計・実装した。',
  },
  {
    no: '10',
    title: 'DEMiXUS システム作成',
    type: 'dev',
    date: '2024-12-12',
    url: 'https://x.com/naporin24690/status/1867179943060504598',
    description: '企画展「共に在る音楽」の作品「DEMiXUS」のシステムを設計・実装した。短期間での開発ながら要望実現のため Cloudflare Stack をフル活用した構成とした。',
  },
  {
    no: '11',
    title: '燭 / MusicVideo Coding Advisor',
    type: 'dev',
    date: '2024-10-10', // date: inferred (tweet /1845201683368071632 = Oct 2024)
    url: 'https://x.com/naporin24690/status/1845201683368071632',
    description: '燭の MV で使用する図形を p5.js で生成できるシンプルなエディターを作成した。',
  },
  {
    no: '12',
    title: '工房祭ステージシステム実装',
    type: 'dev',
    date: '2024-09-14',
    url: 'https://x.com/naporin24690/status/1834900593808490701',
    description: 'OBS のブラウザソースで動作するステージ演出システムを作成した。Cloudflare Workers と WebSocket により OBS とスマホ間の通信を実現。スマホでの正解不正解選択、再生停止操作、回答者位置調整など現場での実用性を重視した機能を搭載。',
  },
  {
    no: '13',
    title: 'Workers Tech Talk #3 登壇',
    type: 'talk',
    date: '2024-08-01',
    url: 'https://speakerdeck.com/naporin0624/durableobjects-nituite',
    description: 'Cloudflare Workers DurableObjects での WebSocket 活用のための Tips について登壇した。自身が直面した問題を具体例として挙げながら、実践的な解決策を紹介した。',
  },
  {
    no: '14',
    title: 'Hono Conf 2024 登壇（初登壇）',
    type: 'talk',
    date: '2024-06-22',
    url: 'https://speakerdeck.com/naporin0624/event-exhibition-with-hono',
    description: 'Hono Conference 2024 - Our first step に登壇した。大阪関西国際芸術祭での展示システム事例について発表。Hono RPC での型安全通信、ReverseProxy と getPath を併用した画像最適化サーバーの構築手法などを紹介した。',
  },
  {
    no: '15',
    title: 'flat-工房 HP 制作サポート',
    type: 'support',
    date: '2024-03-01', // date: inferred (flat-工房 HP, estimated 2024)
    url: 'https://www.flatkobo.com',
    description: 'flat-工房の HP 制作サポートを行った。Next.js を Cloudflare Pages で運用し、コンタクトフォームは ServerAction と Resend で実装し、bot 対策として Cloudflare WAF ページ検証を導入するなど安全な運用を重視した。',
  },
  {
    no: '16',
    title: '彼方 DL ページ作成',
    type: 'dev',
    date: '2024-01-01', // date: inferred (StudioGnu UTAU release, ~2024)
    url: 'https://www.studiognu.org/lp/kanata',
    description: 'StudioGnu で公開した UTAU 彼方のランディングページを作成した。Cloudflare Turnstile で bot 排除後、数分間有効な signed URL でダウンロードリンクを生成。DurableObjects によるダウンロードカウンター機能も搭載。',
  },
  {
    no: '17',
    title: 'ボカコレ2024冬 ランキングの作成',
    type: 'dev',
    date: '2024-12-01', // date: inferred (ボカコレ2024冬 = winter 2024)
    url: 'https://vocaloid-collection-archive.studiognu.org/2024/winter',
    description: 'ボカコレ2024冬のランキングアーカイブを作成した。Cloudflare Cron Trigger で収集したランキングスナップショットを drizzle で Cloudflare D1 に保存する構成に変更した。',
  },
  {
    no: '18',
    title: 'StudioGnu HP の作成',
    type: 'dev',
    date: '2023-06-01', // date: inferred (StudioGnu HP, ~mid-2023)
    url: 'https://www.studiognu.org',
    description: 'StudioGnu の HP を作成した。Next.js と vanilla-extract をメインに使用し、データ管理には MicroCMS を採用。作品ごとの動的 og:image 生成には next/og を活用した。',
  },
  {
    no: '19',
    title: '楽曲「デュレエ」関連データ解析',
    type: 'dev',
    date: '2023-09-01', // date: inferred (デュレエ data analysis, ~2023)
    url: 'https://www.studiognu.org/ja/works/duree',
    description: '楽曲「デュレエ」の一部で使用されるデータの解析を担当した。データ分析に JupyterLab、pandas、numpy を使用し、描画に matplotlib、NetWorkX、JavaScript canvas を活用。',
  },
]

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'works', limit: 1 })
  if (existing.docs.length > 0) return

  for (const work of worksData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({
      collection: 'works',
      data: {
        no: work.no,
        title: work.title,
        type: work.type,
        date: work.date,
        url: work.url,
        description: work.description,
        body: richTextFromParagraphs([work.description]),
        _status: 'published',
      } as any,
    })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
