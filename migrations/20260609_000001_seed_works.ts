import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-d1-sqlite'

import { richTextFromParagraphs } from '../src/utils/sample-rich-text'

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

// Mapping from work `no` to { alt, file } for 1-A history thumbnails (nos 09-42)
// alt = work title (meaningful + dedupes by alt in ensureMedia)
const historyThumbnailMap = new Map<string, { alt: string; file: string }>([
  ['09', { alt: 'PAE2.0 ドットレカギミック制作', file: 'histories/pixelartexhibision2.0.png' }],
  ['10', { alt: 'まだ知らない君がいる 映像提供', file: 'histories/mada-shiranai-kimi.png' }],
  ['11', { alt: 'ボカコレ2025夏 アーカイブ作成', file: 'histories/vocacolle-2025-summer.png' }],
  ['12', { alt: 'おてぃる誕生日 モザイクアート制作', file: 'histories/ristill-birthday-2025.jpg' }],
  ['13', { alt: 'VRChat イベントポスター制作', file: 'histories/vrchat-event-poster.png' }],
  ['14', { alt: 'AKAGE オマージュ動画制作', file: 'histories/akage-homage.png' }],
  ['15', { alt: 'UMANITY HP 制作', file: 'histories/umanity.jpg' }],
  ['16', { alt: 'ヘイロー化ギミック booth 販売', file: 'histories/halo-gimmick.png' }],
  ['17', { alt: 'W♭Y♭K M♭C K システム作成', file: 'histories/WYKMCK.jpeg' }],
  ['18', { alt: 'DEMiXUS システム作成', file: 'histories/DEMiXUS.jpeg' }],
  ['19', { alt: '燭 / MusicVideo Coding Advisor', file: 'histories/tomoshibi.png' }],
  ['20', { alt: '工房祭ステージシステム実装', file: 'histories/five-blocker.png' }],
  ['21', { alt: 'Workers Tech Talk #3 登壇', file: 'histories/cloudflare-workers-tech-talk-3.png' }],
  ['22', { alt: 'Hono Conf 2024 登壇（初登壇）', file: 'histories/hono-conference-2024.png' }],
  ['23', { alt: 'flat-工房 HP 制作サポート', file: 'histories/flatkobo-hp.png' }],
  ['24', { alt: '彼方 DL ページ作成', file: 'histories/kanata.png' }],
  ['25', { alt: 'ボカコレ2024冬 ランキングの作成', file: 'histories/vocacolle-2024.png' }],
  ['26', { alt: 'StudioGnu HP の作成', file: 'histories/www.studiognu.org_ja.png' }],
  ['27', { alt: '楽曲「デュレエ」関連データ解析', file: 'histories/duree.jpg' }],
  ['28', { alt: '「多面体、鏡面」システム作成', file: 'histories/OKIAF.png' }],
  ['29', { alt: '第一象徴体系 LP 作成', file: 'histories/1st-album.hakualab.org.png' }],
  ['30', { alt: 'オリジナル名刺の作成', file: 'histories/meishi-v1.jpg' }],
  ['31', { alt: 'ボカコレランキングアーカイブの作成', file: 'histories/vocacolle-2023.jpg' }],
  ['32', { alt: '熱異常 / シャノン REMIX テクニカルサポート', file: 'histories/netuijou-remix.jpg' }],
  ['33', { alt: 'napochaan.com の作成（旧バージョン）', file: 'histories/napochaan-ogp.png' }],
  ['34', { alt: 'LGTM ジェネレータ', file: 'histories/lgtm-napochaan-com.png' }],
  ['35', { alt: '買取アプリの開発', file: 'histories/flat-kaitori.png' }],
  ['36', { alt: 'ネットショップ UI 開発', file: 'histories/flat-shop.jpg' }],
  ['37', { alt: 'Project BLUE Official HP 作成', file: 'histories/projectblue-hp.png' }],
  ['38', { alt: '447Records TANA の開発', file: 'histories/447pro-tana.jpg' }],
  ['39', { alt: 'instructors ページの開発', file: 'histories/soelu-instructor.png' }],
  ['40', { alt: 'lessons ページの開発', file: 'histories/soelu-lesson.jpg' }],
  ['41', { alt: '名取さなさんのファンアプリ作成（その1）', file: 'histories/natori-ar.jpg' }],
  ['42', { alt: '名取さなさんのファンアプリ作成（その2・別アプリ）', file: 'histories/natori-task.jpg' }],
])

const worksData = [
  // --- 1-C: X-discovered works (newest first within 1-C block) ---
  {
    no: '01',
    title: 'napochaan.com リニューアル',
    type: 'dev',
    date: '2026-06-09',
    url: 'https://github.com/napolab/www.napochaan.com',
    description: 'Next.js + OpenNext + Cloudflare Workers / Payload CMS / Panda CSS で全面リニューアル制作。',
  },
  {
    no: '02',
    title: 'Booth2Booth 公式サイト',
    type: 'dev',
    date: '2026-04-12',
    url: 'https://x.com/naporin24690/status/2043185292337975601',
    description: 'デザイン/実装担当。コンセプト設計重視・高インタラクションな公式サイト（booth2booth.com）を制作した。',
  },
  {
    no: '03',
    title: '#ProjectCircles 椎乃味醂 ライブセクション',
    type: 'support',
    date: '2026-05-05',
    url: 'https://x.com/naporin24690/status/2051632371590701138',
    description: 'モーキャプシステム構築・アニメーション補正を担当した。',
  },
  {
    no: '04',
    title: '#Harmony0118 あみだくじシステム',
    type: 'dev',
    date: '2026-01-18',
    url: 'https://x.com/naporin24690/status/2012874773630685212',
    description: 'パーティ用あみだくじシステムを実装した。',
  },
  {
    no: '05',
    title: '企画展『思弁的な音楽』r-906《額縁の言葉 : I》',
    type: 'support',
    date: '2025-12-10',
    url: 'https://x.com/naporin24690/status/1998715240075374793',
    description: '体験型展示作品の背景映像・システム構築を担当した。',
  },
  {
    no: '06',
    title: 'Vket2025Winter「PrizeSpider」クレーンゲームギミック',
    type: 'vrchat',
    date: '2025-12-06',
    url: 'https://x.com/napochaan_vrc2/status/1998666475687784803',
    description: '九龍帝国 欠番街 -無秩序- での一部 Udon 実装を担当した（動画: OrangeLiner / 出演: SwanPute）。',
  },
  {
    no: '07',
    title: '「解釈系 / ハーモニー」特設サイト',
    type: 'dev',
    date: '2025-11-16',
    url: 'https://x.com/naporin24690/status/1990007733005979981',
    description: 'サイト実装を担当。試聴開始で最後まで自動再生される機能を実装した。',
  },
  {
    no: '08',
    title: 'Event Exhibition with LLM（企画展『拡張される音楽』）',
    type: 'support',
    date: '2024-11-29',
    url: 'https://x.com/naporin24690/status/1862529523344187817',
    description: '投稿サムネ/コメント一覧/キャラポスターを WebSocket + LLM 生成で即時更新するシステムを実装した。',
  },
  // --- 1-A: History items (newest first, items 1-34) ---
  {
    no: '09',
    title: 'PAE2.0 ドットレカギミック制作',
    type: 'dev',
    date: '2025-09-13',
    url: 'https://vrchat.com/home/world/wrld_ab2c1526-c1b1-419d-b138-be32591e799f',
    description: 'VRChat で公開されている VRC PIXELART EXHIBITION 2.0 にドット絵組み合わせギミックを制作・提供した。複数人で同じものを見るための同期機能や、VR・Desktop 環境での最適化など、UX を重視した設計を行った。',
  },
  {
    no: '10',
    title: 'まだ知らない君がいる 映像提供',
    type: 'video',
    date: '2025-05-03', // date: inferred (tweet date context ~2025-05 MV release)
    url: 'https://x.com/naporin24690/status/1959117309689438582',
    description: '椎乃味醂の楽曲「まだ知らない君がいる - 初音ミク･重音テト」の MV に VRChat で撮影した映像を提供した。',
  },
  {
    no: '11',
    title: 'ボカコレ2025夏 アーカイブ作成',
    type: 'dev',
    date: '2025-08-01', // date: inferred (ボカコレ2025夏 = summer 2025)
    url: 'https://vocaloid-collection-archive.studiognu.org/2025/summer',
    description: 'ボカコレ2025夏の統計情報を Web サイトにまとめた。',
  },
  {
    no: '12',
    title: 'おてぃる誕生日 モザイクアート制作',
    type: 'dev',
    date: '2025-04-01', // date: inferred (spring 2025 birthday project)
    url: 'https://ristill.club/2025',
    description: 'VRChat の推しの誕生日を祝うためにモザイクアートと HP を作成した。20人の協力により約3000枚の画像から24000タイルのモザイクアートを制作。モザイクアート生成用の Rust ツールも開発した。',
  },
  {
    no: '13',
    title: 'VRChat イベントポスター制作',
    type: 'flyer',
    date: '2025-06-01', // date: inferred (from tweet context, VRChat event poster)
    url: 'https://x.com/napochaan_vrc2/status/1929843195313377560',
    description: 'VRChat の個人イベント用ポスター・ロゴを制作した。可愛らしさと情報の伝わりやすさを重視したレイアウトを心がけた。',
  },
  {
    no: '14',
    title: 'AKAGE オマージュ動画制作',
    type: 'video',
    date: '2025-04-17', // date: inferred (tweet ~April 2025)
    url: 'https://x.com/ristill_vr/status/1913064949242360039',
    description: 'After Effects を使った初めての動画制作で AKAGE オマージュ動画を作成した。アバターのコンセプトに合わせ、可愛さと面白さを重視した編集を心がけた。',
  },
  {
    no: '15',
    title: 'UMANITY HP 制作',
    type: 'dev',
    date: '2025-03-15',
    url: 'https://ahub.jp/umanity/',
    description: 'AHUB のアルバム「UMANITY」の Web サイトを制作した。アルバム紹介コンテンツやクイズなどのインタラクティブなギミックを搭載した HP を作成した。',
  },
  {
    no: '16',
    title: 'ヘイロー化ギミック booth 販売',
    type: 'dev',
    date: '2025-01-01', // date: inferred (VRChat gimmick released, ~early 2025)
    url: 'https://booth.pm/ja/items/6604904',
    description: 'VRChat で好きなオブジェクトを頭上で回転させるヘイローにできるギミックを制作した。ボタン一つで自動配置する仕組みを実装し、フルパック版では13種類のメニューを用意。汎用的な円形配置スクリプトにより頭部以外の部位にも装着可能で、BOOTH で販売中。',
  },
  {
    no: '17',
    title: 'W♭Y♭K M♭C K システム作成',
    type: 'dev',
    date: '2024-12-12',
    url: 'https://x.com/naporin24690/status/1867175063893811585',
    description: '企画展「共に在る音楽」の作品「W ♭Y ♭K M ♭C K」のシステムを設計・実装した。',
  },
  {
    no: '18',
    title: 'DEMiXUS システム作成',
    type: 'dev',
    date: '2024-12-12',
    url: 'https://x.com/naporin24690/status/1867179943060504598',
    description: '企画展「共に在る音楽」の作品「DEMiXUS」のシステムを設計・実装した。短期間での開発ながら要望実現のため Cloudflare Stack をフル活用した構成とした。',
  },
  {
    no: '19',
    title: '燭 / MusicVideo Coding Advisor',
    type: 'dev',
    date: '2024-10-10', // date: inferred (tweet /1845201683368071632 = Oct 2024)
    url: 'https://x.com/naporin24690/status/1845201683368071632',
    description: '燭の MV で使用する図形を p5.js で生成できるシンプルなエディターを作成した。',
  },
  {
    no: '20',
    title: '工房祭ステージシステム実装',
    type: 'dev',
    date: '2024-09-14',
    url: 'https://x.com/naporin24690/status/1834900593808490701',
    description: 'OBS のブラウザソースで動作するステージ演出システムを作成した。Cloudflare Workers と WebSocket により OBS とスマホ間の通信を実現。スマホでの正解不正会選択、再生停止操作、回答者位置調整など現場での実用性を重視した機能を搭載。',
  },
  {
    no: '21',
    title: 'Workers Tech Talk #3 登壇',
    type: 'talk',
    date: '2024-08-01',
    url: 'https://speakerdeck.com/naporin0624/durableobjects-nituite',
    description: 'Cloudflare Workers DurableObjects での WebSocket 活用のための Tips について登壇した。自身が直面した問題を具体例として挙げながら、実践的な解決策を紹介した。',
  },
  {
    no: '22',
    title: 'Hono Conf 2024 登壇（初登壇）',
    type: 'talk',
    date: '2024-06-22',
    url: 'https://speakerdeck.com/naporin0624/event-exhibition-with-hono',
    description: 'Hono Conference 2024 - Our first step に登壇した。大阪関西国際芸術祭での展示システム事例について発表。Hono RPC での型安全通信、ReverseProxy と getPath を併用した画像最適化サーバーの構築手法などを紹介した。',
  },
  {
    no: '23',
    title: 'flat-工房 HP 制作サポート',
    type: 'support',
    date: '2024-03-01', // date: inferred (flat-工房 HP, estimated 2024)
    url: 'https://www.flatkobo.com',
    description: 'flat-工房の HP 制作サポートを行った。Next.js を Cloudflare Pages で運用し、コンタクトフォームは ServerAction と Resend で実装し、bot 対策として Cloudflare WAF ページ検証を導入するなど安全な運用を重視した。',
  },
  {
    no: '24',
    title: '彼方 DL ページ作成',
    type: 'dev',
    date: '2024-01-01', // date: inferred (StudioGnu UTAU release, ~2024)
    url: 'https://www.studiognu.org/lp/kanata',
    description: 'StudioGnu で公開した UTAU 彼方のランディングページを作成した。Cloudflare Turnstile で bot 排除後、数分間有効な signed URL でダウンロードリンクを生成。DurableObjects によるダウンロードカウンター機能も搭載。',
  },
  {
    no: '25',
    title: 'ボカコレ2024冬 ランキングの作成',
    type: 'dev',
    date: '2024-12-01', // date: inferred (ボカコレ2024冬 = winter 2024)
    url: 'https://vocaloid-collection-archive.studiognu.org/2024/winter',
    description: 'ボカコレ2024冬のランキングアーカイブを作成した。Cloudflare Cron Trigger で収集したランキングスナップショットを drizzle で Cloudflare D1 に保存する構成に変更した。',
  },
  {
    no: '26',
    title: 'StudioGnu HP の作成',
    type: 'dev',
    date: '2023-06-01', // date: inferred (StudioGnu HP, ~mid-2023)
    url: 'https://www.studiognu.org',
    description: 'StudioGnu の HP を作成した。Next.js と vanilla-extract をメインに使用し、データ管理には MicroCMS を採用。作品ごとの動的 og:image 生成には next/og を活用した。',
  },
  {
    no: '27',
    title: '楽曲「デュレエ」関連データ解析',
    type: 'dev',
    date: '2023-09-01', // date: inferred (デュレエ data analysis, ~2023)
    url: 'https://www.studiognu.org/ja/works/duree',
    description: '楽曲「デュレエ」の一部で使用されるデータの解析を担当した。データ分析に JupyterLab、pandas、numpy を使用し、描画に matplotlib、NetWorkX、JavaScript canvas を活用。',
  },
  {
    no: '28',
    title: '「多面体、鏡面」システム作成',
    type: 'dev',
    date: '2023-12-01', // date: inferred (大阪関西国際芸術祭2023, ~Dec 2023)
    url: 'https://x.com/StudioGnu/status/1741010587495416144',
    description: '大阪関西国際芸術祭2023に出展するためのシステムを作成した。感想投稿機能、ChatGPT API と StableDiffusion による自動動画生成システム、ポスター・コメント表示画面を実装した。',
  },
  {
    no: '29',
    title: '第一象徴体系 LP 作成',
    type: 'dev',
    date: '2023-11-01', // date: inferred (シャノン 1st album LP, ~late 2023)
    url: 'https://1st-album.hakualab.org/',
    description: 'シャノンの 1st アルバムのランディングページを作成した。Figma でデザインし Astro で実装した。',
  },
  {
    no: '30',
    title: 'オリジナル名刺の作成',
    type: 'graphic',
    date: '2023-09-14', // date: inferred (tweet /1705577231928697299 = ~Sep 2023)
    url: 'https://x.com/naporin24690/status/1705577231928697299',
    description: 'オリジナル名刺を作成した。Figma でデザインから入稿まですべて自力で実施。キャラクターをメインにしたシンプルで情報が伝わりやすいレイアウトにこだわった。',
  },
  {
    no: '31',
    title: 'ボカコレランキングアーカイブの作成',
    type: 'dev',
    date: '2023-08-01', // date: inferred (ボカコレ2023夏 = summer 2023)
    url: 'https://vocaloid-collection-archive.studiognu.org/',
    description: 'ボカコレ2023夏の毎時ランキングアーカイブを作成した。縦横両方向の仮想スクロールで大量コンテンツの高速検索を実現。データ基盤は Cloudflare Workers + KV + R2、アプリケーションは Hono で構築。',
  },
  {
    no: '32',
    title: '熱異常 / シャノン REMIX テクニカルサポート',
    type: 'support',
    date: '2023-07-01', // date: inferred (tweet /1687483050253561856 = ~Jul 2023)
    url: 'https://x.com/naporin24690/status/1687483050253561856',
    description: 'シャノンの熱異常 REMIX のテクニカルサポートを担当した。主にプログラム部分をサポート。',
  },
  {
    no: '33',
    title: 'napochaan.com の作成（旧バージョン）',
    type: 'dev',
    date: '2022-06-01', // date: inferred (旧 napochaan.com, ~2022)
    url: 'https://github.com/napolab/www.napochaan.com',
    description: 'Figma の勉強を兼ねて作成したポートフォリオサイト。Next.js + Cloudflare Pages で高速表示を実現し、react-spring でキャラクターやコンテンツにアニメーションを付与。（※旧バージョン）',
  },
  {
    no: '34',
    title: 'LGTM ジェネレータ',
    type: 'dev',
    date: '2022-03-01', // date: inferred (Cloudflare Workers LGTM generator, ~2022)
    url: 'https://lgtm.napochaan.com/',
    description: 'satori で作成した LGTM ジェネレーターを Cloudflare Workers にデプロイ。URL パラメーターで文字色と背景画像をカスタマイズ可能。',
  },
  {
    no: '35',
    title: '買取アプリの開発',
    type: 'dev',
    date: '2022-01-01', // date: inferred (flat-工房 買取アプリ, ~2022)
    url: 'https://flat-kobo-kaitori.web.app/',
    description: 'flat-工房の買取専用アプリを開発した。デザイン以外の全部分を担当し、Firebase + React + vanilla-extract + react-hook-form で構築。',
  },
  {
    no: '36',
    title: 'ネットショップ UI 開発',
    type: 'dev',
    date: '2021-06-01', // date: inferred (flat-工房 ネットショップ, ~2021)
    url: 'https://flatkobo.shop',
    description: 'flat-工房のネットショップ UI 改善プロジェクトを担当。デザイン以外の全部分を担当し、lit-element をメインに使用して開発。',
  },
  {
    no: '37',
    title: 'Project BLUE Official HP 作成',
    type: 'dev',
    date: '2021-01-01', // date: inferred (ProjectBLUE HP, ~2021)
    url: 'https://pjblue.jp',
    description: 'ProjectBLUE の公式 HP を作成した。Next.js + styled-components で構築。',
  },
  {
    no: '38',
    title: '447Records TANA の開発',
    type: 'dev',
    date: '2020-06-01', // date: inferred (447Records TANA, ~2020)
    url: 'https://tana.447pro.com/',
    description: '447Records TANA の開発を担当した。主にオーディオプレイヤー周りを実装。Apple Music のような洗練されたインタラクションを目指した。',
  },
  {
    no: '39',
    title: 'instructors ページの開発',
    type: 'dev',
    date: '2020-03-01', // date: inferred (tweet /1244865712490856448 = ~Mar 2020, 新卒入社)
    url: 'https://x.com/naporin24690/status/1244865712490856448',
    description: '新卒で入社した会社のアプリページを作成した。',
  },
  {
    no: '40',
    title: 'lessons ページの開発',
    type: 'dev',
    date: '2020-02-01', // date: inferred (tweet /1227830616227344384 = ~Feb 2020, インターン)
    url: 'https://x.com/naporin24690/status/1227830616227344384',
    description: 'インターン先で主要な検索ページを作成した。検索 UI の初実装を通じてコンポーネント分割の手法を学んだ。',
  },
  {
    no: '41',
    title: '名取さなさんのファンアプリ作成（その1）',
    type: 'dev',
    date: '2019-03-01', // date: inferred (tweet /1106641342506004480 = ~Mar 2019)
    url: 'https://x.com/naporin24690/status/1106641342506004480',
    description: '桜を見に行くために作成したファンアプリ。iOS で AR を簡単に実現できる web アプリをラップした推し専用アプリ。',
  },
  {
    no: '42',
    title: '名取さなさんのファンアプリ作成（その2・別アプリ）',
    type: 'dev',
    date: '2019-01-01', // date: inferred (tweet /1091367573587865601 = ~Jan 2019, first web app)
    url: 'https://x.com/naporin24690/status/1091367573587865601',
    description: '初めて作成した web アプリケーション。タスク管理アプリに推しの声をかけ合わせることで、ユニークで面白い体験を作り出した。',
  },
]

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'works', limit: 1 })
  if (existing.docs.length > 0) return

  // Pre-create all history thumbnail media rows (idempotent by alt)
  const thumbnailIds = new Map<string, number>()
  for (const [no, { alt, file }] of historyThumbnailMap.entries()) {
    const mediaId = await ensureMedia(payload, alt, file)
    thumbnailIds.set(no, mediaId)
  }

  for (const work of worksData) {
    const thumbnail = thumbnailIds.get(work.no)
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
        ...(thumbnail !== undefined ? { thumbnail } : {}),
        _status: 'published',
      } as any,
    })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
