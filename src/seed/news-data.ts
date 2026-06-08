// Ported verbatim from the former `src/app/(site)/news/sample-news.ts`. The body
// text becomes `paragraphs` (run through richTextFromParagraphs at seed time).
// Spans several year-month groups (2026-06 → 2025-12) so the archive's grouping
// has multiple buckets and the list paginates.
export type NewsSeed = {
  publishedAt: string;
  category: 'live' | 'release' | 'update';
  title: string;
  url?: string;
  paragraphs: readonly string[];
};

export const newsSeed: readonly NewsSeed[] = [
  {
    publishedAt: '2026-06-05',
    category: 'update',
    title: 'サイトを全面リニューアルしました',
    paragraphs: ['グリッドと黒のグロテスク、エレクトリックブルーで組み直したポートフォリオを公開しました。', '制作物・お知らせ・年表をひとつの版面に統合し、情報の更新に強い構造へ作り変えています。'],
  },
  {
    publishedAt: '2026-06-01',
    category: 'live',
    title: 'Booth²Booth vol.12 への出演が決定しました',
    url: 'https://vrchat.com/home/launch?worldId=wrld_booth2booth-vol12',
    paragraphs: ['VRDJ イベント Booth²Booth vol.12 に DJ / VJ として出演します。当日はフロアの熱量を光跡で可視化する予定です。'],
  },
  {
    publishedAt: '2026-05-23',
    category: 'release',
    title: 'works ページを公開しました',
    url: '/works',
    paragraphs: ['フライヤー・グラフィック・VJ の制作物をアーカイブとして公開しました。年ごとに積み上がる台帳形式で閲覧できます。'],
  },
  {
    publishedAt: '2026-05-10',
    category: 'live',
    title: 'Booth²Booth vol.11 を開催しました',
    paragraphs: ['VR 空間で Booth²Booth vol.11 を開催しました。多数のご来場ありがとうございました。'],
  },
  {
    publishedAt: '2026-05-02',
    category: 'update',
    title: 'VJ セットの設計についての記事を公開しました',
    paragraphs: ['BPM を座標へ流し込む VJ セットの設計手法について、ブログ記事を公開しました。'],
  },
  {
    publishedAt: '2026-04-20',
    category: 'update',
    title: 'about ページを更新しました',
    paragraphs: ['プロフィールとスキルの一覧を最新の状態に更新しました。'],
  },
  {
    publishedAt: '2026-04-04',
    category: 'release',
    title: '新しいキービジュアルを公開しました',
    paragraphs: ['Booth²Booth シリーズの基準となるキービジュアルを公開しました。余白と矩形の間で会場の鼓動を設計した一枚です。'],
  },
  {
    publishedAt: '2026-03-28',
    category: 'live',
    title: 'Booth²Booth vol.10 への出演が決定しました',
    paragraphs: ['節目となる vol.10 に DJ として出演します。テクノの四つ打ちで会場を回します。'],
  },
  {
    publishedAt: '2026-03-12',
    category: 'update',
    title: 'Cloudflare Workers で組んだ配信基盤の話を公開しました',
    paragraphs: ['イベント配信を支える Cloudflare Workers ベースの基盤構成について、技術記事を公開しました。'],
  },
  {
    publishedAt: '2026-02-22',
    category: 'update',
    title: '型を自分の視点で設計する話を公開しました',
    paragraphs: ['呼び出し側の都合に合わせて型を広げない、という設計指針についてのブログ記事を公開しました。'],
  },
  {
    publishedAt: '2026-02-08',
    category: 'live',
    title: 'Booth²Booth vol.9 を開催しました',
    paragraphs: ['VR 空間で Booth²Booth vol.9 を開催しました。ゲストとともにオールジャンルで回しました。'],
  },
  {
    publishedAt: '2026-01-25',
    category: 'release',
    title: '新しいフライヤーシリーズを公開しました',
    paragraphs: ['方眼の交点に光を宿らせたネオングリッドのフライヤーシリーズを公開しました。'],
  },
  {
    publishedAt: '2026-01-11',
    category: 'update',
    title: 'blog ページを公開しました',
    paragraphs: ['技術記事とエッセイをまとめた blog ページを公開しました。'],
  },
  {
    publishedAt: '2025-12-30',
    category: 'update',
    title: '2025 年の振り返りを公開しました',
    paragraphs: ['DJ を始め、VJ に手を伸ばした一年の振り返りを公開しました。'],
  },
  {
    publishedAt: '2025-12-14',
    category: 'live',
    title: 'Booth²Booth vol.8 への出演が決定しました',
    paragraphs: ['vol.8 に DJ / VJ として出演します。自作ソフトによる映像演出を持ち込みます。'],
  },
  {
    publishedAt: '2025-12-01',
    category: 'release',
    title: 'VJ ソフトの最初のデモを公開しました',
    url: 'https://soundcloud.com/napochaan/booth2booth-vj-demo',
    paragraphs: ['Electron と WebGPU で組んだ自作 VJ ソフトの最初のデモ映像を公開しました。'],
  },
];
