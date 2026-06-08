import { richTextFromParagraphs } from '@utils/sample-rich-text';

import type { NewsItem } from './_lib/news-item';

// Sample feed — replaced by a Payload `news` collection later. This is the full
// announcement feed; the home teaser (NewsSection) shows only the latest 3 of
// it. Spans several year-month groups (2026-06 → 2025-12) so the archive's
// `YYYY / MM` grouping has multiple buckets and the list paginates. Content fits
// the owner — a programmer / DJ / VJ who runs the VRDJ event "Booth²Booth".
export const news: readonly NewsItem[] = [
  {
    id: '1',
    date: '2026-06-05',
    category: 'site',
    title: 'サイトを全面リニューアルしました',
    body: richTextFromParagraphs([
      'グリッドと黒のグロテスク、エレクトリックブルーで組み直したポートフォリオを公開しました。',
      '制作物・お知らせ・年表をひとつの版面に統合し、情報の更新に強い構造へ作り変えています。',
    ]),
  },
  {
    id: '2',
    date: '2026-06-01',
    category: 'live',
    title: 'Booth²Booth vol.12 への出演が決定しました',
    // External event page — the log timeline links straight to the listing.
    url: 'https://vrchat.com/home/launch?worldId=wrld_booth2booth-vol12',
    body: richTextFromParagraphs(['VRDJ イベント Booth²Booth vol.12 に DJ / VJ として出演します。当日はフロアの熱量を光跡で可視化する予定です。']),
  },
  {
    id: '3',
    date: '2026-05-23',
    category: 'release',
    title: 'works ページを公開しました',
    // Internal link example — the announcement points at the page it announces.
    url: '/works',
    body: richTextFromParagraphs(['フライヤー・グラフィック・VJ の制作物をアーカイブとして公開しました。年ごとに積み上がる台帳形式で閲覧できます。']),
  },
  {
    id: '4',
    date: '2026-05-10',
    category: 'live',
    title: 'Booth²Booth vol.11 を開催しました',
    body: richTextFromParagraphs(['VR 空間で Booth²Booth vol.11 を開催しました。多数のご来場ありがとうございました。']),
  },
  {
    id: '5',
    date: '2026-05-02',
    category: 'blog',
    title: 'VJ セットの設計についての記事を公開しました',
    body: richTextFromParagraphs(['BPM を座標へ流し込む VJ セットの設計手法について、ブログ記事を公開しました。']),
  },
  {
    id: '6',
    date: '2026-04-20',
    category: 'site',
    title: 'about ページを更新しました',
    body: richTextFromParagraphs(['プロフィールとスキルの一覧を最新の状態に更新しました。']),
  },
  {
    id: '7',
    date: '2026-04-04',
    category: 'release',
    title: '新しいキービジュアルを公開しました',
    body: richTextFromParagraphs(['Booth²Booth シリーズの基準となるキービジュアルを公開しました。余白と矩形の間で会場の鼓動を設計した一枚です。']),
  },
  {
    id: '8',
    date: '2026-03-28',
    category: 'live',
    title: 'Booth²Booth vol.10 への出演が決定しました',
    body: richTextFromParagraphs(['節目となる vol.10 に DJ として出演します。テクノの四つ打ちで会場を回します。']),
  },
  {
    id: '9',
    date: '2026-03-12',
    category: 'blog',
    title: 'Cloudflare Workers で組んだ配信基盤の話を公開しました',
    body: richTextFromParagraphs(['イベント配信を支える Cloudflare Workers ベースの基盤構成について、技術記事を公開しました。']),
  },
  {
    id: '10',
    date: '2026-02-22',
    category: 'blog',
    title: '型を自分の視点で設計する話を公開しました',
    body: richTextFromParagraphs(['呼び出し側の都合に合わせて型を広げない、という設計指針についてのブログ記事を公開しました。']),
  },
  {
    id: '11',
    date: '2026-02-08',
    category: 'live',
    title: 'Booth²Booth vol.9 を開催しました',
    body: richTextFromParagraphs(['VR 空間で Booth²Booth vol.9 を開催しました。ゲストとともにオールジャンルで回しました。']),
  },
  {
    id: '12',
    date: '2026-01-25',
    category: 'release',
    title: '新しいフライヤーシリーズを公開しました',
    body: richTextFromParagraphs(['方眼の交点に光を宿らせたネオングリッドのフライヤーシリーズを公開しました。']),
  },
  {
    id: '13',
    date: '2026-01-11',
    category: 'site',
    title: 'blog ページを公開しました',
    body: richTextFromParagraphs(['技術記事とエッセイをまとめた blog ページを公開しました。']),
  },
  {
    id: '14',
    date: '2025-12-30',
    category: 'blog',
    title: '2025 年の振り返りを公開しました',
    body: richTextFromParagraphs(['DJ を始め、VJ に手を伸ばした一年の振り返りを公開しました。']),
  },
  {
    id: '15',
    date: '2025-12-14',
    category: 'live',
    title: 'Booth²Booth vol.8 への出演が決定しました',
    body: richTextFromParagraphs(['vol.8 に DJ / VJ として出演します。自作ソフトによる映像演出を持ち込みます。']),
  },
  {
    id: '16',
    date: '2025-12-01',
    category: 'release',
    title: 'VJ ソフトの最初のデモを公開しました',
    // External release — demo reel hosted off-site.
    url: 'https://soundcloud.com/napochaan/booth2booth-vj-demo',
    body: richTextFromParagraphs(['Electron と WebGPU で組んだ自作 VJ ソフトの最初のデモ映像を公開しました。']),
  },
];
